import { db, publications, desc } from "@inkwell/db";
import { env } from "@/env";

export const dynamic = "force-dynamic";

export async function GET() {
  let publishedStories: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    publishedStories = await db.query.publications.findMany({
      orderBy: [desc(publications.publishedAt)],
      limit: 500,
    });
  } catch {
    // Zero-credential offline fallback
    publishedStories = [{ slug: "kilimo-bora-nakuru", updatedAt: new Date() }];
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const xmlEntries = publishedStories
    .map((story) => {
      return `  <url>
    <loc>${baseUrl}/p/${story.slug}</loc>
    <lastmod>${story.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${xmlEntries}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
