import { NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { getAnthropicClient, generateMockStream } from "@/lib/anthropic-client";
import { resolveActivePrompt } from "@/lib/prompt-loader";
import { calculateTokenCost } from "@/lib/currency";
import { checkWorkspaceBudget } from "@/lib/budget-guard";
import {
  sanitizeUserContext,
  wrapInUntrustedBoundary,
  moderateContent,
  resolveOutputTokenCap,
} from "@/lib/safeguards";
import { piiSafeLogger } from "@/lib/pii-logger";
import { db, generations, usageEvents } from "@inkwell/db";

export const dynamic = "force-dynamic";

const generateRequestSchema = z.object({
  workspaceId: z.string().uuid().or(z.string().min(1)),
  userId: z.string().default("user_chris_nairobi"),
  documentId: z.string().uuid().optional(),
  promptId: z.string().uuid().optional(),
  contentType: z.enum(["blog", "social", "grant_proposal"]).default("blog"),
  language: z.enum(["en", "sw"]).default("en"),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  context: z.string().optional().default(""),
  tone: z
    .enum(["professional", "editorial", "conversational", "urgent"])
    .default("professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
});

export async function POST(req: NextRequest) {
  const abortSignal = req.signal;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let jsonBody: unknown;
  try {
    jsonBody = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON request payload" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const parsed = generateRequestSchema.safeParse(jsonBody);
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
    workspaceId,
    userId,
    documentId,
    promptId,
    contentType,
    language,
    topic,
    context,
    tone,
    length,
  } = parsed.data;

  // 1. Hard-Stop Budget Policy Check
  const budgetStatus = await checkWorkspaceBudget(workspaceId);
  if (budgetStatus.hardStopActive) {
    piiSafeLogger.warn(
      `Generation blocked by workspace hard-stop policy for ${workspaceId}`,
      {
        currentSpendKes: budgetStatus.currentSpendKes,
        budgetMonthlyKes: budgetStatus.budgetMonthlyKes,
      },
      requestId,
    );

    return new Response(
      JSON.stringify({
        error: "Workspace budget limit exceeded",
        message: `Monthly budget limit of KSh ${budgetStatus.budgetMonthlyKes.toLocaleString()} reached. Generation blocked by hard-stop policy.`,
        percentage: budgetStatus.percentage,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Prompt Injection Hygiene & Sanitization
  const sanitization = sanitizeUserContext(topic, context);
  if (sanitization.hasInjectionAttempt) {
    piiSafeLogger.warn(
      "Prompt injection attempt neutralized in generation request",
      { warnings: sanitization.injectionWarnings },
      requestId,
    );
  }

  // 3. Content Moderation Hook
  const moderationCheck = moderateContent(
    `${sanitization.sanitizedTopic} ${sanitization.sanitizedContext}`,
  );
  if (moderationCheck.flagged) {
    piiSafeLogger.warn(
      `Generation request rejected by content moderation: ${moderationCheck.reason}`,
      { category: moderationCheck.category },
      requestId,
    );

    return new Response(
      JSON.stringify({
        error: "Content policy violation",
        reason: moderationCheck.reason,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. Resolve active prompt version
  const activePrompt = await resolveActivePrompt({
    workspaceId,
    contentType,
    language,
    promptId,
  });

  const boundedContext = wrapInUntrustedBoundary(sanitization.sanitizedContext);

  const userMessageContent = activePrompt.userPromptTemplate
    .replace("{{topic}}", sanitization.sanitizedTopic)
    .replace("{{context}}", boundedContext)
    .replace("{{tone}}", tone)
    .replace("{{length}}", length);

  const modelId = env.ANTHROPIC_MODEL;
  const maxTokens = resolveOutputTokenCap(contentType, length);
  const startTime = Date.now();

  piiSafeLogger.info(
    `Starting generation with model ${modelId} for content type ${contentType} [${language}]`,
    { maxTokens },
    requestId,
  );

  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    async start(controller) {
      function sendEvent(type: string, data: Record<string, unknown>) {
        const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      let accumulatedText = "";
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        if (env.AI_MOCK_MODE) {
          const mockStream = generateMockStream({
            contentType,
            language,
            topic: sanitization.sanitizedTopic,
            signal: abortSignal,
          });

          for await (const chunk of mockStream) {
            if (abortSignal.aborted) {
              break;
            }

            if (chunk.type === "text" && chunk.text) {
              accumulatedText += chunk.text;
              sendEvent("delta", { text: chunk.text });
            } else if (chunk.type === "usage") {
              if (chunk.inputTokens !== undefined)
                inputTokens = chunk.inputTokens;
              if (chunk.outputTokens !== undefined)
                outputTokens = chunk.outputTokens;
            }
          }
        } else {
          const anthropic = getAnthropicClient();
          const responseStream = await anthropic.messages.create(
            {
              model: modelId,
              max_tokens: maxTokens,
              system: activePrompt.systemPrompt,
              messages: [{ role: "user", content: userMessageContent }],
              stream: true,
            },
            { signal: abortSignal },
          );

          for await (const messageStreamEvent of responseStream) {
            if (abortSignal.aborted) {
              break;
            }

            if (messageStreamEvent.type === "message_start") {
              inputTokens = messageStreamEvent.message.usage.input_tokens || 0;
            } else if (
              messageStreamEvent.type === "content_block_delta" &&
              messageStreamEvent.delta.type === "text_delta"
            ) {
              const textDelta = messageStreamEvent.delta.text;
              accumulatedText += textDelta;
              sendEvent("delta", { text: textDelta });
            } else if (messageStreamEvent.type === "message_delta") {
              outputTokens = messageStreamEvent.usage.output_tokens || 0;
            }
          }
        }

        const latencyMs = Date.now() - startTime;
        const cost = calculateTokenCost({
          modelId,
          inputTokens,
          outputTokens,
          usdToKesRate: env.USD_TO_KES_RATE,
        });

        piiSafeLogger.info(
          `Completed generation: in=${inputTokens}, out=${outputTokens}, cost=${cost.formattedKes}`,
          { latencyMs },
          requestId,
        );

        try {
          if (activePrompt.versionId) {
            const [gen] = await db
              .insert(generations)
              .values({
                documentId: documentId || null,
                promptVersionId: activePrompt.versionId,
                workspaceId,
                userId,
                inputPrompt: userMessageContent,
                outputContent: accumulatedText,
                modelId,
                inputTokens,
                outputTokens,
                latencyMs,
                status: abortSignal.aborted ? "cancelled" : "completed",
              })
              .returning();

            await db.insert(usageEvents).values({
              time: new Date(),
              workspaceId,
              userId,
              generationId: gen.id,
              modelId,
              inputTokens,
              outputTokens,
              costKes: cost.costKes.toString(),
              costUsd: cost.costUsd.toString(),
            });
          }
        } catch (dbError) {
          piiSafeLogger.warn(
            "Failed to persist generation record to DB",
            { error: String(dbError) },
            requestId,
          );
        }

        sendEvent("done", {
          status: abortSignal.aborted ? "cancelled" : "completed",
          modelId,
          versionNumber: activePrompt.versionNumber,
          inputTokens,
          outputTokens,
          costKes: cost.costKes,
          costUsd: cost.costUsd,
          formattedKes: cost.formattedKes,
          formattedUsd: cost.formattedUsd,
          latencyMs,
        });

        controller.close();
      } catch (err: unknown) {
        if (abortSignal.aborted) {
          sendEvent("error", { error: "Generation cancelled by user" });
          controller.close();
          return;
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected AI error occurred";
        piiSafeLogger.error(
          `AI Generation failure: ${errorMessage}`,
          undefined,
          requestId,
        );
        sendEvent("error", { error: errorMessage });
        controller.close();
      }
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
