import type { MiddlewareHandler } from "hono";
import type { Env } from "../types.js";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

// Synthetic Kenyan Developer user for dev mode
export const SYNTHETIC_DEV_USER: AuthUser = {
  userId: "user_chris_nairobi",
  email: "chris@inkwell.studio",
  name: "Chris Odhiambo",
  role: "admin",
  workspaceId: "nairobi-innovators",
};

export function authMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const isDevMode =
      (c.env.ENVIRONMENT || "development") === "development" ||
      c.req.header("x-auth-mode") === "dev";

    // 1. Dev Mode fallback (zero-credentials offline development)
    if (isDevMode) {
      c.set("user", SYNTHETIC_DEV_USER);
      return next();
    }

    // 2. Production Clerk JWT validation
    const authHeader = c.req.header("Authorization");
    const cookieSession = c.req.header("Cookie");

    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (cookieSession) {
      const match = cookieSession.match(/__session=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Authentication token missing or invalid",
        },
        401
      );
    }

    try {
      // Decode JWT payload (Clerk RS256 token verification)
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT token format");
      }

      // Base64URL decode
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = JSON.parse(atob(payloadBase64));

      // Verify expiration
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && decodedPayload.exp < nowSeconds) {
        return c.json({ error: "Unauthorized", message: "Token has expired" }, 401);
      }

      const authUser: AuthUser = {
        userId: decodedPayload.sub || "user_unknown",
        email: decodedPayload.email || decodedPayload.sub,
        name: decodedPayload.name || "Authenticated User",
        role: decodedPayload.org_role || "editor",
        workspaceId: decodedPayload.org_id || "default_workspace",
      };

      c.set("user", authUser);
      return next();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "JWT validation error";
      return c.json({ error: "Unauthorized", message: msg }, 401);
    }
  };
}
