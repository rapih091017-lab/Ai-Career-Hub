/**
 * Environment Variable Validation
 *
 * Validates all required env vars on startup using Zod.
 * Fail fast — if a required var is missing, throw immediately
 * so the dev/deploy knows exactly what's wrong.
 */

import { z } from "zod";

const envSchema = z.object({
  // ── Database ────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required — PostgreSQL connection string"),

  // ── NextAuth ────────────────────────────────────────────
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required — generate via: openssl rand -base64 32"),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // ── AI / DeepSeek ───────────────────────────────────────
  DEEPSEEK_API_KEY: z.string().min(1, "DEEPSEEK_API_KEY is required — get from https://platform.deepseek.com/api_keys"),
  OPENAI_BASE_URL: z.string().url("OPENAI_BASE_URL must be a valid URL").default("https://api.deepseek.com/v1"),

  // ── Midtrans Payment ────────────────────────────────────
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  // ── Admin ───────────────────────────────────────────────
  ADMIN_EMAILS: z.string().optional(),

  // ── Public URLs ─────────────────────────────────────────
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_BASE_URL must be a valid URL")
    .default("http://localhost:3000"),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Parse and validate process.env against the schema.
 * Throws on first missing/invalid required var so startup fails early.
 */
export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  • ${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(
      `❌ Environment variable validation failed:\n${issues.join("\n")}\n\n` +
        "Check your .env file or Vercel environment variables.",
    );
  }

  validatedEnv = result.data;
  return validatedEnv;
}

/**
 * Get validated env (cached after first call).
 * Use this instead of raw process.env throughout the app.
 */
export function env(): Env {
  if (!validatedEnv) return validateEnv();
  return validatedEnv;
}
