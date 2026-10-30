import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Mock db: rantai select().from().where() selalu mengembalikan nilai hitung.
const usageCount = { value: 0 };
vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: async () => [usageCount] }) }),
    insert: () => ({ values: async () => undefined }),
  },
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
const accessMock = vi.fn();
vi.mock("@/lib/access", () => ({ getUserAccess: (...a: unknown[]) => accessMock(...a) }));

import { checkQuota, startOfMonthUtc } from "@/lib/api-utils";

function access(limits: Record<string, unknown>) {
  return { tierName: "Gratis", limits, isPremium: false, purchasedFeatures: {}, activePackages: [] };
}

beforeEach(() => {
  usageCount.value = 0;
  accessMock.mockReset();
});

describe("checkQuota cv_build (R1)", () => {
  it("memakai limit ai_cv_generate", async () => {
    accessMock.mockResolvedValue(access({ ai_cv_generate: 1 }));
    expect(await checkQuota("u1", "cv_build")).toEqual({ allowed: true });
    usageCount.value = 1;
    const res = await checkQuota("u1", "cv_build");
    expect("status" in res && res.status).toBe(403);
  });

  it("paket dengan ai_cv_generate false ditolak", async () => {
    accessMock.mockResolvedValue(access({ ai_cv_generate: false }));
    const res = await checkQuota("u1", "cv_build");
    expect("status" in res && res.status).toBe(403);
  });

  it("limit tidak terdaftar ditolak (fail-closed)", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    accessMock.mockResolvedValue(access({}));
    const res = await checkQuota("u1", "cv_build");
    expect("status" in res && res.status).toBe(403);
    const body = await (res as Response).json();
    expect(body.error).toBe("FEATURE_NOT_AVAILABLE");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("awal bulan UTC", () => {
  it("startOfMonthUtc memotong ke tanggal 1 jam 00:00 UTC", () => {
    expect(startOfMonthUtc(new Date("2026-03-31T23:30:00Z")).toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
  it("/api/usage memakai helper yang sama", () => {
    const src = readFileSync(join(process.cwd(), "src/app/api/usage/route.ts"), "utf8");
    expect(src).toContain("startOfMonthUtc()");
  });
});

describe("cv-documents/create logUsage", () => {
  it("tidak menelan error logUsage diam-diam", () => {
    const src = readFileSync(join(process.cwd(), "src/app/api/cv-documents/create/route.ts"), "utf8");
    expect(src).not.toMatch(/logUsage\([^)]*\)\.catch\(\(\) => \{\}\)/);
    expect(src).toContain("console.error");
  });
});
