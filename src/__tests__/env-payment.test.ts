import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const BASE_ENV = {
  DATABASE_URL: "postgres://x/y",
  AUTH_SECRET: "s",
  DEEPSEEK_API_KEY: "k",
};

let cached: typeof import("@/lib/env") | null = null;

/** NODE_ENV wajib ikut ada, jadi env penuh ditulis lewat helper ini. */
function setEnv(values: Record<string, string>) {
  process.env = { NODE_ENV: "test", ...values } as NodeJS.ProcessEnv;
}

async function loadEnv() {
  if (!cached) cached = await import("@/lib/env");
  return cached;
}

async function resetModule() {
  vi.resetModules();
  cached = null;
}

describe("env: payment provider", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    for (const k of ["PAYMENT_PROVIDER", "KASERA_API_KEY", "KASERA_WEBHOOK_SECRET", "KASERA_API_BASE"]) {
      delete process.env[k];
    }
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it("default ke midtrans supaya tidak ada perubahan diam-diam", async () => {
    setEnv({ ...BASE_ENV });
    await resetModule();
    const { env } = await loadEnv();
    expect(env().PAYMENT_PROVIDER).toBe("midtrans");
  });

  it("baca kasera beserta key dan secret-nya", async () => {
    setEnv({
      ...BASE_ENV,
      PAYMENT_PROVIDER: "kasera",
      KASERA_API_KEY: "kp_test_abc",
      KASERA_WEBHOOK_SECRET: "whsec_abc",
      KASERA_API_BASE: "https://sandbox.pay.kasera.id/v1",
    });
    await resetModule();
    const { env } = await loadEnv();
    expect(env().PAYMENT_PROVIDER).toBe("kasera");
    expect(env().KASERA_API_KEY).toBe("kp_test_abc");
    expect(env().KASERA_WEBHOOK_SECRET).toBe("whsec_abc");
    expect(env().KASERA_API_BASE).toBe("https://sandbox.pay.kasera.id/v1");
  });

  it("tolak nilai provider yang tidak dikenal", async () => {
    setEnv({ ...BASE_ENV, PAYMENT_PROVIDER: "stiki" });
    await resetModule();
    const { validateEnv } = await loadEnv();
    expect(() => validateEnv()).toThrow(/PAYMENT_PROVIDER/);
  });
});