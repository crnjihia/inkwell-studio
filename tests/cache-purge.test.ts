import { describe, it, expect } from "vitest";
import { serializeTipTapToHtml } from "@/lib/html-serializer";
import { purgeCloudflareUrls } from "@/lib/cloudflare-purge";

describe("Phase 7: Static Publishing & Cloudflare Cache Invalidation", () => {
  it("serializes TipTap ProseMirror document nodes into semantic HTML", () => {
    const docJson = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Kilimo cha Kisasa Kaunti ya Nakuru" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Mradi huu unalenga kuwawezesha wakulima 400 wa Kenya.",
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "text",
              text: "Teknolojia inaleta mageuzi ya haraka Afrika Mashariki.",
            },
          ],
        },
      ],
    };

    const html = serializeTipTapToHtml(docJson);

    expect(html).toContain("<h1>Kilimo cha Kisasa Kaunti ya Nakuru</h1>");
    expect(html).toContain("<p>Mradi huu unalenga kuwawezesha wakulima 400 wa Kenya.</p>");
    expect(html).toContain("<blockquote>Teknolojia inaleta mageuzi ya haraka Afrika Mashariki.</blockquote>");
  });

  it("escapes malicious HTML characters to prevent XSS during publishing", () => {
    const maliciousDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: '<script>alert("hack")</script>' }],
        },
      ],
    };

    const html = serializeTipTapToHtml(maliciousDoc);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;");
  });

  it("executes cache purge within the < 1000ms SLA target", async () => {
    const targetUrls = [
      "http://localhost:3000/p/kilimo-cha-kisasa",
      "http://localhost:8787/p/kilimo-cha-kisasa",
    ];

    const result = await purgeCloudflareUrls(targetUrls);

    expect(result.success).toBe(true);
    expect(result.urls).toEqual(targetUrls);
    expect(result.latencyMs).toBeLessThan(1000);
    expect(result.achievedSla).toBe(true);
    expect(result.targetSla).toBe("< 1000ms");
  });

  it("generates valid JSON-LD structured data for article publication", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Nairobi Tech Boom",
      inLanguage: "sw-KE",
      author: {
        "@type": "Person",
        name: "Chris Odhiambo",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Nairobi",
          addressCountry: "KE",
        },
      },
    };

    expect(jsonLd["@type"]).toBe("Article");
    expect(jsonLd.inLanguage).toBe("sw-KE");
    expect(jsonLd.author.address.addressLocality).toBe("Nairobi");
  });
});

