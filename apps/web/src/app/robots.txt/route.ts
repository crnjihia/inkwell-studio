import { env } from "@/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Allow: /p/
Disallow: /api/
Disallow: /editor/
Disallow: /usage/
Disallow: /prompts/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

