import type { MiddlewareHandler } from "hono";
import type { Env } from "../types.js";

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory token bucket cache per Worker isolate
const tokenBuckets = new Map<string, TokenBucket>();

export interface RateLimiterOptions {
  rpm?: number; // Requests per minute
  burstCapacity?: number;
}

export function rateLimiter(
  options: RateLimiterOptions = {},
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const rpm = options.rpm || parseInt(c.env.EDGE_RATE_LIMIT_RPM || "60", 10);
    const capacity = options.burstCapacity || rpm;
    const refillRatePerMs = rpm / 60_000; // tokens per millisecond

    // Resolve rate limiting key: User ID if authenticated, else IP address
    const authUser = c.get("user");
    const clientIp =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1";

    const bucketKey = authUser ? `usr:${authUser.userId}` : `ip:${clientIp}`;
    const now = Date.now();

    let bucket = tokenBuckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: now,
      };
      tokenBuckets.set(bucketKey, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsedMs = now - bucket.lastRefill;
      bucket.tokens = Math.min(
        capacity,
        bucket.tokens + elapsedMs * refillRatePerMs,
      );
      bucket.lastRefill = now;
    }

    const resetSeconds = Math.ceil((capacity - bucket.tokens) / (rpm / 60));

    // Check if token available
    if (bucket.tokens < 1) {
      c.header("X-RateLimit-Limit", capacity.toString());
      c.header("X-RateLimit-Remaining", "0");
      c.header(
        "X-RateLimit-Reset",
        (Math.floor(now / 1000) + resetSeconds).toString(),
      );
      c.header("Retry-After", resetSeconds.toString());

      return c.json(
        {
          error: "Too Many Requests",
          message: `Edge rate limit exceeded (${rpm} requests per minute). Please slow down.`,
          retryAfterSeconds: resetSeconds,
        },
        429,
      );
    }

    // Consume 1 token
    bucket.tokens -= 1;

    c.header("X-RateLimit-Limit", capacity.toString());
    c.header("X-RateLimit-Remaining", Math.floor(bucket.tokens).toString());
    c.header(
      "X-RateLimit-Reset",
      (Math.floor(now / 1000) + resetSeconds).toString(),
    );

    await next();
  };
}
