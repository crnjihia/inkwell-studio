import { NextRequest } from "next/server";
import { z } from "zod";
import { db, prompts, promptVersions, eq, desc } from "@inkwell/db";
import { computeNextSemver } from "@/lib/diff";

export const dynamic = "force-dynamic";

const createPromptVersionSchema = z.object({
  promptId: z.string().uuid(),
  systemPrompt: z
    .string()
    .min(10, "System prompt must be at least 10 characters"),
  userPromptTemplate: z
    .string()
    .min(5, "Template must be at least 5 characters"),
  changeSummary: z.string().min(5, "Audit change summary is required"),
  changeType: z.enum(["major", "minor", "patch"]).default("minor"),
  makeActive: z.boolean().default(true),
  userId: z.string().default("user_chris_nairobi"),
});

// GET /api/prompts - List all prompts with version history
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  try {
    const promptList = await db.query.prompts.findMany({
      where: workspaceId ? eq(prompts.workspaceId, workspaceId) : undefined,
      with: {
        versions: {
          orderBy: [desc(promptVersions.versionCounter)],
        },
      },
      orderBy: [desc(prompts.updatedAt)],
    });

    return new Response(JSON.stringify({ prompts: promptList }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.warn(
      "Prompts API: Database not reachable, returning synthetic Nairobi prompts:",
      error,
    );
    const syntheticPrompts = [
      {
        id: "prompt_swahili_blog",
        name: "Mwandishi wa Makala ya Kiswahili",
        description:
          "Hutengeneza makala ya kina na machapisho ya kijamii yanayoeleweka Afrika Mashariki.",
        contentType: "blog",
        language: "sw",
        activeVersionId: "pv_swahili_01",
        versions: [
          {
            id: "pv_swahili_01",
            versionNumber: "1.1.0",
            versionCounter: 2,
            systemPrompt:
              "Wewe ni mhariri na mwandishi mkuu wa makala za kiteknolojia na kiuchumi Afrika Mashariki. Andika kwa Kiswahili sanifu, fasaha, na chenye msamiati sahihi unaoeleweka Nairobi na ukanda mzima.",
            userPromptTemplate:
              "Andika makala ya kina na ya kuvutia kuhusu mada hii: {{topic}}. Muktadha: {{context}}.",
            changeSummary: "Imarisha msamiati wa Kiswahili na sarafu ya KES.",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "pv_swahili_00",
            versionNumber: "1.0.0",
            versionCounter: 1,
            systemPrompt:
              "Wewe ni mhariri wa makala za teknolojia Afrika Mashariki.",
            userPromptTemplate: "Andika makala kuhusu {{topic}}.",
            changeSummary: "Toleo la awali.",
            isActive: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      {
        id: "prompt_usaid_grant",
        name: "USAID East Africa Grant Writer",
        description:
          "Produces institutional grant applications with Theory of Change and KES budget structures.",
        contentType: "grant_proposal",
        language: "en",
        activeVersionId: "pv_grant_01",
        versions: [
          {
            id: "pv_grant_01",
            versionNumber: "1.0.0",
            versionCounter: 1,
            systemPrompt:
              "You are a senior institutional grant specialist operating in Nairobi, Kenya. Structure proposals with Executive Summary, Problem Statement, Theory of Change, and Budget in KES and USD.",
            userPromptTemplate:
              "Draft a comprehensive grant application for {{topic}}. Target budget in KES.",
            changeSummary:
              "Initial version for USAID and regional development partners.",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ];

    return new Response(JSON.stringify({ prompts: syntheticPrompts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST /api/prompts - Publish a new immutable prompt version
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = createPromptVersionSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const {
    promptId,
    systemPrompt,
    userPromptTemplate,
    changeSummary,
    changeType,
    makeActive,
    userId,
  } = parsed.data;

  try {
    // 1. Fetch prompt and latest version
    const promptRecord = await db.query.prompts.findFirst({
      where: eq(prompts.id, promptId),
      with: {
        versions: {
          orderBy: [desc(promptVersions.versionCounter)],
          limit: 1,
        },
      },
    });

    if (!promptRecord) {
      return new Response(JSON.stringify({ error: "Prompt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const latestVersion = promptRecord.versions[0];
    const nextCounter = latestVersion ? latestVersion.versionCounter + 1 : 1;
    const nextSemver = latestVersion
      ? computeNextSemver(latestVersion.versionNumber, changeType)
      : "1.0.0";

    // 2. If making active, unset previous active versions
    if (makeActive) {
      await db
        .update(promptVersions)
        .set({ isActive: false })
        .where(eq(promptVersions.promptId, promptId));
    }

    // 3. Insert new immutable version
    const [newVersion] = await db
      .insert(promptVersions)
      .values({
        promptId,
        versionNumber: nextSemver,
        versionCounter: nextCounter,
        systemPrompt,
        userPromptTemplate,
        isActive: makeActive,
        changeSummary,
        createdById: userId,
      })
      .returning();

    // 4. Update prompt's activeVersionId and timestamp
    if (makeActive) {
      await db
        .update(prompts)
        .set({
          activeVersionId: newVersion.id,
          updatedAt: new Date(),
        })
        .where(eq(prompts.id, promptId));
    }

    return new Response(JSON.stringify({ version: newVersion }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to create prompt version:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
