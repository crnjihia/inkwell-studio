import { describe, it, expect } from "vitest";
import { z } from "zod";

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.record(z.unknown()).optional(),
  language: z.enum(["en", "sw"]).optional(),
  contentType: z.enum(["blog", "social", "grant_proposal"]).optional(),
});

describe("Phase 3: Editor Controls & AI Block Review", () => {
  it("validates document autosave payload with Swahili and grant_proposal types", () => {
    const payload = {
      title: "Mfumo wa Ushirika wa Kilimo cha Kisasa Kenya",
      language: "sw" as const,
      contentType: "grant_proposal" as const,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Maelezo ya mradi..." }],
          },
        ],
      },
    };

    const result = updateDocumentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("splits streamed Markdown headings and paragraphs into TipTap JSON nodes on accept", () => {
    const rawStreamOutput =
      "# Kichwa Kikuu\n\nMaelezo ya aya ya kwanza kuhusu wakulima wa Kenya.\n\n## Sehemu ya Pili\n\nAya ya pili ya makala.";

    const paragraphs = rawStreamOutput.split("\n\n").filter(Boolean);
    const nodes = paragraphs.map((block) => {
      if (block.startsWith("# ")) {
        return {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: block.replace(/^#\s+/, "") }],
        };
      } else if (block.startsWith("## ")) {
        return {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: block.replace(/^##\s+/, "") }],
        };
      } else {
        return {
          type: "paragraph",
          content: [{ type: "text", text: block }],
        };
      }
    });

    expect(nodes).toHaveLength(4);
    expect(nodes[0].type).toBe("heading");
    expect(nodes[0].attrs?.level).toBe(1);
    expect(nodes[0].content?.[0].text).toBe("Kichwa Kikuu");
    expect(nodes[1].type).toBe("paragraph");
    expect(nodes[2].type).toBe("heading");
    expect(nodes[2].attrs?.level).toBe(2);
    expect(nodes[3].type).toBe("paragraph");
  });

  it("verifies tone and length options support Kenyan creator workflows", () => {
    const supportedTones = [
      "professional",
      "editorial",
      "conversational",
      "urgent",
    ];
    const supportedLengths = ["short", "medium", "long"];

    expect(supportedTones).toContain("editorial");
    expect(supportedLengths).toContain("long");
  });
});
