import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { packageBenefits, benefitLabel, periodLabel, type CatalogPackage } from "@/lib/pricing-catalog";

const billingSrc = readFileSync(join(process.cwd(), "src/app/settings/billing/page.tsx"), "utf8");
const apiSrc = readFileSync(join(process.cwd(), "src/app/api/packages/route.ts"), "utf8");

const premium: CatalogPackage = {
  key: "premium_pass_30d",
  name: "Premium Pass 30 Hari",
  price: 119000,
  periodDays: 30,
  monthly: true,
  maxActivePortfolios: 0,
  limits: {
    ai_cv_generate: "unlimited",
    cv_analyzer: "unlimited",
    ai_revision: "unlimited",
    ai_suggestion: "unlimited",
    portfolio_web: false,
  },
};

const single: CatalogPackage = {
  key: "single_cv",
  name: "Single CV AI Revision",
  price: 25000,
  periodDays: 365,
  monthly: false,
  maxActivePortfolios: 0,
  limits: { ai_revision: 1, ai_suggestion: "unlimited", ai_cv_generate: false },
};

const t = (key: string) => key;

describe("daftar paket di halaman tagihan", () => {
  it("isi paket dibaca dari limits katalog, bukan ditulis manual per kartu", () => {
    // Dulu tiap kartu punya daftar benefits yang diketik tangan di JSX, sehingga
    // bisa berbeda dengan kuota di database. Sekarang kartu paket membaca
    // `limits` dari katalog.
    expect(billingSrc).not.toMatch(/"Unlimited CV Builder"/);
    expect(billingSrc).not.toMatch(/"1x AI Smart Revision"/);
    const cardSrc = readFileSync(join(process.cwd(), "src/components/checkout/PackageCard.tsx"), "utf8");
    expect(cardSrc).toContain("packageBenefits(pkg)");
    expect(cardSrc).toContain("benefitLabel(benefit, t)");
    expect(billingSrc).toContain("catalogPackages");
  });

  it("katalog yang dipakai billing mengirim limits", () => {
    expect(apiSrc).toContain("limits: p.limits");
  });

  it("hanya fitur yang termasuk paket yang ditampilkan", () => {
    const benefits = packageBenefits(premium);
    expect(benefits.map((b) => b.key)).toEqual([
      "ai_cv_generate",
      "cv_analyzer",
      "ai_revision",
      "ai_suggestion",
    ]);
    expect(benefits).not.toContainEqual({ key: "portfolio_web", value: "unlimited" });
  });

  it("kuota dan masa berlaku ditulis dalam bahasa manusia", () => {
    expect(benefitLabel({ key: "ai_cv_generate", value: "unlimited" }, t)).toContain("billing.limit.unlimited");
    expect(benefitLabel({ key: "ai_revision", value: 1 }, t)).toBe("1x billing.limit.ai_revision");
    expect(periodLabel(premium, t)).toBe("billing.period.monthly");
    expect(periodLabel(single, t)).toBe("billing.period.year");
  });

  it("semua tombol beli mengarah ke checkout atau pemilih CV", () => {
    // Satu langkah setelah pilih paket: rangkum dulu, baru QR. Tidak ada order
    // yang dibuat sebelum pengguna mengonfirmasi di halaman checkout.
    expect(billingSrc).toContain('pkg.key === "single_cv" ? handleSingleCvClick');
    expect(billingSrc).not.toContain("create-order");
  });
});