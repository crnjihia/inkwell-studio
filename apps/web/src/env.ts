import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_EDGE_URL: z.string().url().default("http://localhost:8787"),
  APP_TIMEZONE: z.string().default("Africa/Nairobi"),
  DEFAULT_CURRENCY: z.string().default("KES"),
  USD_TO_KES_RATE: z.coerce.number().positive().default(130.0),

  // Anthropic AI
  // Model ID is loaded strictly from ANTHROPIC_MODEL (never hard-coded)
  ANTHROPIC_API_KEY: z.string().min(1).default("sk-ant-mock-key-for-local-dev"),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-3-5-sonnet-20241022"),
  AI_MOCK_MODE: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .default("true"),

  // Database
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/inkwell_dev"),

  // Authentication
  AUTH_MODE: z.enum(["dev", "clerk"]).default("dev"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),

  // Cloudflare
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  EDGE_RATE_LIMIT_RPM: z.coerce.number().positive().default(60),

  // Email notifications
  EMAIL_ADAPTER: z.enum(["mock", "smtp"]).default("mock"),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_EDGE_URL: process.env.NEXT_PUBLIC_EDGE_URL,
  APP_TIMEZONE: process.env.APP_TIMEZONE,
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY,
  USD_TO_KES_RATE: process.env.USD_TO_KES_RATE,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  AI_MOCK_MODE: process.env.AI_MOCK_MODE,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_MODE: process.env.AUTH_MODE,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  EDGE_RATE_LIMIT_RPM: process.env.EDGE_RATE_LIMIT_RPM,
  EMAIL_ADAPTER: process.env.EMAIL_ADAPTER,
});
