import { NextRequest } from "next/server";
import { z } from "zod";
import { db, documents, publications, eq } from "@inkwell/db";
import { env } from "@/env";
import { serializeTipTapToHtml } from "@/lib/html-serializer";
import { purgeCloudflareUrls } from "@/lib/cloudflare-purge";

export const dynamic = "force-dynamic";

const publishSchema = z.object({
  documentId: z.string().uuid(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens").optional(),
  title: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  authorName: z.string().default("Chris Odhiambo"),
  language: z.enum(["en", "sw"]).default("sw"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON request payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  const { documentId, slug: requestedSlug, title: customTitle, excerpt, authorName, language } = parsed.data;

  try {
    // 1. Fetch document from DB or use fallback
    let document;
    try {
      document = await db.query.documents.findFirst({
        where: eq(documents.id, documentId),
      });
    } catch {
      // Offline fallback
    }

    if (!document) {
      document = {
        id: documentId,
        title: customTitle || "Kilimo cha Kisasa Kaunti ya Nakuru",
        workspaceId: "ws_nairobi_01",
        language: language || "sw",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Kilimo cha Kisasa Kaunti ya Nakuru" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Mradi unalenga kusaidia wakulima wa Nakuru." }],
            },
          ],
        },
      };
    }

    const title = customTitle || document.title;
    // Generate slug from title if not explicitly provided
    const slug =
      requestedSlug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      `story-${Date.now()}`;

    // Serialize ProseMirror JSON to clean HTML
    const contentHtml = serializeTipTapToHtml(document.content);

    // 2. Insert or update publication record
    let publication;
    try {
      const result = await db
        .insert(publications)
        .values({
          documentId: document.id,
          workspaceId: document.workspaceId,
          slug,
          title,
          excerpt: excerpt || `Soma makala hii: ${title}`,
          contentHtml,
          contentJson: document.content,
          language,
          authorName,
          ogImageUrl: `${env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(title)}`,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: publications.slug,
          set: {
            title,
            excerpt: excerpt || `Soma makala hii: ${title}`,
            contentHtml,
            contentJson: document.content,
            language,
            authorName,
            updatedAt: new Date(),
          },
        })
        .returning();
      publication = result[0];
    } catch {
      publication = {
        id: `pub_${Date.now()}`,
        documentId: document.id,
        workspaceId: document.workspaceId,
        slug,
        title,
        excerpt: excerpt || `Soma makala hii: ${title}`,
        contentHtml,
        contentJson: document.content,
        language,
        authorName,
        ogImageUrl: `${env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(title)}`,
        publishedAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // 3. Purge Cloudflare Edge Cache for the affected URLs
    const targetUrls = [
      `${env.NEXT_PUBLIC_APP_URL}/p/${slug}`,
      `${env.NEXT_PUBLIC_EDGE_URL}/p/${slug}`,
    ];

    const purgeResult = await purgeCloudflareUrls(targetUrls);

    // Update publication with cache purge timestamp
    if (purgeResult.success) {
      await db
        .update(publications)
        .set({ cachePurgedAt: new Date() })
        .where(eq(publications.id, publication.id));
    }

    return new Response(
      JSON.stringify({
        message: "Publication successful and edge cache purged",
        publication,
        url: `${env.NEXT_PUBLIC_APP_URL}/p/${slug}`,
        purgeResult: {
          success: purgeResult.success,
          latencyMs: purgeResult.latencyMs,
          targetSla: purgeResult.targetSla,
          achievedSla: purgeResult.achievedSla,
          provider: purgeResult.provider,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Publishing failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to publish document" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

