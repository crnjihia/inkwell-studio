import { Hono } from "hono";
import type { Env } from "../types.js";

export const cacheRouter = new Hono<{ Bindings: Env }>();

// GET /p/:slug - Serve published page with edge caching via Cache API
cacheRouter.get("/p/:slug", async (c) => {
  const slug = c.req.param("slug");
  const originUrl = c.env.ORIGIN_URL || "http://localhost:3000";

  // Build cache key Request object
  const cacheKey = new Request(c.req.url, {
    method: "GET",
    headers: c.req.raw.headers,
  });

  // Cloudflare Cache API (caches.default in workers runtime)
  let cache: Cache | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cache = (caches as any).default;
  } catch {
    // In local non-worker test environments
    cache = undefined;
  }

  // 1. Check edge cache
  if (cache) {
    try {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set("CF-Cache-Status", "HIT");
        response.headers.set("X-Edge-Source", "Cloudflare-Cache-API");
        return response;
      }
    } catch (err) {
      console.warn("Edge cache lookup error:", err);
    }
  }

  // 2. Fetch fresh content from origin server
  try {
    const originResponse = await fetch(`${originUrl}/p/${slug}`, {
      headers: {
        "x-edge-routed": "true",
      },
    });

    if (!originResponse.ok) {
      return c.text("Published story not found", originResponse.status as 404);
    }

    const response = new Response(originResponse.body, originResponse);

    // Set edge cache-control headers
    response.headers.set("CF-Cache-Status", "MISS");
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    );

    // 3. Put into edge cache asynchronously
    if (cache && originResponse.status === 200) {
      c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  } catch (error) {
    console.error("Origin fetch error:", error);
    return c.text("Failed to reach origin server", 502);
  }
});

// POST /api/cache/purge - Cache purge endpoint
cacheRouter.post("/api/cache/purge", async (c) => {
  const startTime = Date.now();

  let body: { urls?: string[]; slug?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  const urlsToPurge: string[] = [];

  if (body.slug) {
    const originHost = new URL(c.req.url).origin;
    urlsToPurge.push(`${originHost}/p/${body.slug}`);
  }

  if (body.urls && Array.isArray(body.urls)) {
    urlsToPurge.push(...body.urls);
  }

  let purgedCount = 0;

  // Cloudflare Cache API delete
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache = (caches as any).default as Cache | undefined;
    if (cache) {
      for (const targetUrl of urlsToPurge) {
        const deleted = await cache.delete(new Request(targetUrl));
        if (deleted) purgedCount++;
      }
    }
  } catch (err) {
    console.warn("Local cache API purge note:", err);
  }

  const latencyMs = Date.now() - startTime;

  return c.json({
    success: true,
    purged: urlsToPurge,
    purgedCount,
    latencyMs,
    targetSla: "< 1000ms",
    achievedSla: latencyMs < 1000,
  });
});
