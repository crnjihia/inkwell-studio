import { describe, it, expect } from "vitest";
import { calculateTokenCost, formatKes, formatUsd } from "@/lib/currency";
import { generateMockStream } from "@/lib/anthropic-client";
import { resolveActivePrompt } from "@/lib/prompt-loader";

describe("Phase 2: Generation Engine & SSE Token Accounting", () => {
  it("calculates accurate token costs in USD and KES based on Claude 3.5 Sonnet pricing", () => {
    // 1,000 input tokens ($0.003), 500 output tokens ($0.0075) = $0.0105
    // At 130 KES/USD: 0.0105 * 130 = 1.365 KES
    const cost = calculateTokenCost({
      modelId: "claude-3-5-sonnet-20241022",
      inputTokens: 1000,
      outputTokens: 500,
      usdToKesRate: 130.0,
    });

    expect(cost.costUsd).toBeCloseTo(0.0105, 4);
    expect(cost.costKes).toBeCloseTo(1.365, 3);
    expect(cost.formattedKes).toBe("KSh 1.365");
    expect(cost.formattedUsd).toBe("$0.0105");
  });

  it("formats Kenyan currency with KSh prefix and two decimal places", () => {
    expect(formatKes(25000)).toBe("KSh 25,000.00");
    expect(formatUsd(192.307)).toBe("$192.3070");
  });

  it("yields streaming tokens and usage events in mock mode for Swahili grant proposals", async () => {
    const mockStream = generateMockStream({
      contentType: "grant_proposal",
      language: "sw",
      topic: "Kilimo Bora cha Mahindi Nakuru",
    });

    const receivedChunks: string[] = [];
    let initialUsageReceived = false;
    let finalUsageReceived = false;

    for await (const chunk of mockStream) {
      if (chunk.type === "usage") {
        if (!initialUsageReceived) {
          initialUsageReceived = true;
          expect(chunk.inputTokens).toBeGreaterThan(0);
        } else {
          finalUsageReceived = true;
          expect(chunk.outputTokens).toBeGreaterThan(0);
        }
      } else if (chunk.type === "text" && chunk.text) {
        receivedChunks.push(chunk.text);
      }
    }

    const fullText = receivedChunks.join("");
    expect(fullText).toContain("Muhtasari wa Mradi");
    expect(fullText).toContain("Kilimo Bora cha Mahindi Nakuru");
    expect(fullText).toContain("KES");
    expect(initialUsageReceived).toBe(true);
    expect(finalUsageReceived).toBe(true);
  });

  it("aborts mock stream cleanly when AbortSignal triggers", async () => {
    const abortController = new AbortController();
    const mockStream = generateMockStream({
      contentType: "blog",
      language: "en",
      topic: "Tech in Nairobi",
      signal: abortController.signal,
    });

    let count = 0;
    for await (const chunk of mockStream) {
      if (chunk.type === "text") {
        count++;
        if (count >= 3) {
          abortController.abort();
        }
      }
    }

    expect(count).toBeGreaterThanOrEqual(3);
    expect(abortController.signal.aborted).toBe(true);
  });

  it("resolves built-in East African prompt fallbacks when DB prompt is omitted", async () => {
    const prompt = await resolveActivePrompt({
      workspaceId: "00000000-0000-0000-0000-000000000000",
      contentType: "grant_proposal",
      language: "en",
    });

    expect(prompt.systemPrompt).toContain("USAID East Africa");
    expect(prompt.userPromptTemplate).toContain("{{topic}}");
    expect(prompt.versionNumber).toBe("1.0.0-builtin");
  });
});
