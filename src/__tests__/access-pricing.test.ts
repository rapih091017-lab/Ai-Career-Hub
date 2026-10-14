import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CURRENT_PACKAGES, LEGACY_PACKAGES } from "@/lib/package-catalog-static";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/** Potong blok di antara dua penanda urut dalam file sumber. */
function block(src: string, from: string, to: string): string {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a + 1);
  expect(a).toBeGreaterThanOrEqual(0);
  expect(b).toBeGreaterThan(a);
  return src.slice(a, b);
}

const access = read("src/lib/access.ts");
const pricing = read("src/components/PricingSection.tsx");
const staticCatalog = read("src/lib/package-catalog-static.ts");

describe("free tier memberi cicip AI portfolio", () => {
  it("FREE_LIMITS.portfolio_web bernilai 1 (bukan false)", () => {
    // Regresi: false berarti /api/portfolio/suggest langsung 403 untuk user
    // gratis, padahal kartu Free menjanjikan 1x AI portfolio/bulan.
    const freeBlock = block(access, "export const FREE_LIMITS", "export interface UserAccess");
    expect(freeBlock).toMatch(/portfolio_web:\s*1/);
    expect(freeBlock).not.toMatch(/portfolio_web:\s*false/);
  });
});

describe("paket portfolio membuktikan janji kartunya", () => {
  it("mengaktifkan portfolio web dan ekspor PDF tanpa batas", () => {
    const pkg = CURRENT_PACKAGES.portfolio_web;
    expect(pkg.limits.portfolio_web).toBe(1);
    expect(pkg.limits.pdf_export).toBe("unlimited");
    expect(pkg.limits.ai_suggestion).toBe("unlimited");
    expect(pkg.price).toBe(29000);
    expect(pkg.periodDays).toBe(30);
  });
});

describe("halaman harga memakai data katalog, bukan angka yang diketik tangan", () => {
  it("harga kartu dibaca dari katalog", () => {
    // Dulu angka harga ditulis langsung di file ini, jadi bisa melenceng dari
    // yang ditagih di checkout.
    expect(pricing).toContain("useCatalogPackages()");
    expect(pricing).not.toMatch(/id: "(cv-starter|cv-ai-generate|cv-analyzer|pro)"[,}]/);
  });

  it("daftar isi kartu dibaca dari kuota paket", () => {
    expect(pricing).toContain("packageBenefits(pkg)");
    expect(pricing).toContain("benefitText(");
  });

  it("semua paket yang ditampilkan ada di katalog", () => {
    for (const key of ["cek_cv", "bikin_cv", "surat_lamaran", "portfolio_web", "paket_lamaran"]) {
      expect(pricing).toContain(`key: "${key}"`);
      expect(CURRENT_PACKAGES[key]).toBeDefined();
    }
    for (const key of ["lite_bulanan", "pro_bulanan", "max_bulanan"]) {
      expect(pricing).toContain(`key: "${key}"`);
      expect(CURRENT_PACKAGES[key]).toBeDefined();
    }
  });

  it("paket lama tetap ada sebagai definisi agar pembayaran lama tidak kehilangan hak", () => {
    for (const key of ["pro_monthly", "premium_pass_30d", "business_monthly", "cv_starter"]) {
      expect(LEGACY_PACKAGES[key]).toBeDefined();
    }
    // Tapi tidak boleh ikut dipasang di access.ts sebagai paket yang dijual.
    const current = block(staticCatalog, "CURRENT_PACKAGES", "LEGACY_PACKAGES");
    expect(current).not.toContain("premium_pass_30d");
    expect(current).not.toContain("business_monthly");
  });
});

describe("tanpa klaim yang tidak bisa dipertanggungjawabkan", () => {
  it("halaman harga tidak memakai diskon fiktif", () => {
    const i18n = read("src/lib/i18n.tsx");
    expect(i18n).not.toContain("Hemat 30%");
    expect(pricing).not.toContain("originalPrice");
  });

  it("fitur yang belum ada tidak masuk paket yang dijual", () => {
    for (const key of Object.keys(CURRENT_PACKAGES)) {
      expect(CURRENT_PACKAGES[key].limits.bulk_analyzer).toBe(false);
      expect(CURRENT_PACKAGES[key].limits.white_label).toBe(false);
    }
  });

  it("paket bulanan menyebut masa berlakunya", () => {
    for (const key of ["lite_bulanan", "pro_bulanan", "max_bulanan"]) {
      expect(CURRENT_PACKAGES[key].monthly).toBe(true);
      expect(CURRENT_PACKAGES[key].periodDays).toBe(30);
    }
  });

  it("batas wajar model mendalam ditulis di halaman harga", () => {
    const i18n = read("src/lib/i18n.tsx");
    expect(i18n).toContain("pricing.fair-use-note");
    expect(pricing).toContain('t("pricing.fair-use-note")');
  });
});

describe("katalog statis sama dengan definisi di access.ts", () => {
  it("harga paket yang dijual identik", () => {
    // Dua sumber ini harus bergerak bersama; kalau tidak, tampilan dan tagihan
    // bisa berbeda saat salah satu terlewat.
    const accessBlock = block(access, "cek_cv: {", "cv_ai_generate: {");
    for (const key of ["cek_cv", "bikin_cv", "surat_lamaran", "portfolio_web", "paket_lamaran"]) {
      expect(accessBlock).toContain(`price: ${CURRENT_PACKAGES[key].price}`);
    }
  });

  it("unit harga di landing sesuai paket", () => {
    expect(pricing).toContain("pricing.unit.one-application");
    expect(pricing).toContain("pricing.unit.per-month");
  });
});