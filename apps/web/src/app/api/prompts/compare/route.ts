import { NextRequest } from "next/server";
import { z } from "zod";
import { db, promptVersions, eq } from "@inkwell/db";
import { env } from "@/env";
import { calculateTokenCost } from "@/lib/currency";
import { generateMockStream, getAnthropicClient } from "@/lib/anthropic-client";

export const dynamic = "force-dynamic";

const compareSchema = z.object({
  versionIdA: z.string().uuid(),
  versionIdB: z.string().uuid(),
  topic: z.string().min(3),
  context: z.string().optional().default(""),
  language: z.enum(["en", "sw"]).default("en"),
  contentType: z.enum(["blog", "social", "grant_proposal"]).default("blog"),
  tone: z.enum(["professional", "editorial", "conversational", "urgent"]).default("professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = compareSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  const {
    versionIdA,
    versionIdB,
    topic,
    context,
    language,
    contentType,
    tone,
    length,
  } = parsed.data;

  try {
    let [versionA, versionB] = await Promise.all([
      db.query.promptVersions.findFirst({ where: eq(promptVersions.id, versionIdA) }).catch(() => null),
      db.query.promptVersions.findFirst({ where: eq(promptVersions.id, versionIdB) }).catch(() => null),
    ]);

    if (!versionA || !versionB) {
      // Synthetic fallback for offline zero-credential preview
      versionA = versionA || {
        id: versionIdA,
        promptId: "prompt_swahili_blog",
        versionNumber: "1.0.0",
        versionCounter: 1,
        systemPrompt: "Wewe ni mhariri wa makala Nairobi.",
        userPromptTemplate: "Andika makala kuhusu {{topic}}.",
        changeSummary: "Baseline prompt",
        isActive: false,
        createdAt: new Date(),
        createdById: "user_chris_nairobi",
      };
      versionB = versionB || {
        id: versionIdB,
        promptId: "prompt_swahili_blog",
        versionNumber: "1.1.0",
        versionCounter: 2,
        systemPrompt:
          "Wewe ni mhariri na mwandishi mkuu wa makala za kiteknolojia na kiuchumi Afrika Mashariki. Andika kwa Kiswahili sanifu chenye nambari za KES.",
        userPromptTemplate: "Andika makala ya kina kuhusu mada hii: {{topic}}.",
        changeSummary: "Challenger with KES context",
        isActive: true,
        createdAt: new Date(),
        createdById: "user_chris_nairobi",
      };
    }

    const modelId = env.ANTHROPIC_MODEL;

    // Helper to run a generation for one version
    async function runVersion(
      version: NonNullable<typeof versionA>,
      variantName: "A" | "B"
    ) {
      const userMessage = version.userPromptTemplate
        .replace("{{topic}}", topic)
        .replace("{{context}}", context)
        .replace("{{tone}}", tone)
        .replace("{{length}}", length);

      const startTime = Date.now();
      let outputText = "";
      let inputTokens = 0;
      let outputTokens = 0;

      if (env.AI_MOCK_MODE) {
        const stream = generateMockStream({
          contentType,
          language,
          topic: `${topic} (${variantName === "A" ? "Baseline" : "Challenger"})`,
        });

        for await (const chunk of stream) {
          if (chunk.type === "text" && chunk.text) {
            outputText += chunk.text;
          } else if (chunk.type === "usage") {
            if (chunk.inputTokens !== undefined) inputTokens = chunk.inputTokens;
            if (chunk.outputTokens !== undefined) outputTokens = chunk.outputTokens;
          }
        }
      } else {
        const anthropic = getAnthropicClient();
        const resp = await anthropic.messages.create({
          model: modelId,
          max_tokens: length === "short" ? 500 : length === "long" ? 2500 : 1200,
          system: version.systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });

        const firstBlock = resp.content[0];
        if (firstBlock && firstBlock.type === "text") {
          outputText = firstBlock.text;
        }
        inputTokens = resp.usage.input_tokens;
        outputTokens = resp.usage.output_tokens;
      }

      const latencyMs = Date.now() - startTime;
      const cost = calculateTokenCost({
        modelId,
        inputTokens,
        outputTokens,
        usdToKesRate: env.USD_TO_KES_RATE,
      });

      return {
        variant: variantName,
        versionId: version.id,
        versionNumber: version.versionNumber,
        systemPrompt: version.systemPrompt,
        changeSummary: version.changeSummary,
        outputText,
        inputTokens,
        outputTokens,
        latencyMs,
        costKes: cost.costKes,
        costUsd: cost.costUsd,
        formattedKes: cost.formattedKes,
        formattedUsd: cost.formattedUsd,
      };
    }

    // Run both prompt versions concurrently
    const [resultA, resultB] = await Promise.all([
      runVersion(versionA, "A"),
      runVersion(versionB, "B"),
    ]);

    const costDiffKes = Number((resultB.costKes - resultA.costKes).toFixed(4));
    const tokenDiff = resultB.outputTokens - resultA.outputTokens;
    const latencyDiffMs = resultB.latencyMs - resultA.latencyMs;

    return new Response(
      JSON.stringify({
        modelId,
        variantA: resultA,
        variantB: resultB,
        comparison: {
          costDiffKes,
          tokenDiff,
          latencyDiffMs,
          moreEconomical: resultA.costKes <= resultB.costKes ? "A" : "B",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Comparison execution failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to execute prompt comparison" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

