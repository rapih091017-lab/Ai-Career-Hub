import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
const migration = read("drizzle/0024_pricing_value.sql");

describe("free tier memberi cicip AI portfolio", () => {
  it("FREE_LIMITS.portfolio_web bernilai 1 (bukan false)", () => {
    // Regresi: false berarti /api/portfolio/suggest langsung 403 untuk user
    // gratis — padahal kartu Free menjanjikan 1x AI portfolio/bulan.
    const freeBlock = block(access, "export const FREE_LIMITS", "export interface UserAccess");
    expect(freeBlock).toMatch(/portfolio_web:\s*1/);
    expect(freeBlock).not.toMatch(/portfolio_web:\s*false/);
  });
});

describe("paket portfolio 35rb membuktikan janji kartunya", () => {
  it("mengaktifkan AI portfolio dan PDF export tanpa batas", () => {
    const pkg = block(access, "portfolio_web: {", "bundle_hemat: {");
    expect(pkg).toContain('portfolio_web: "unlimited"');
    expect(pkg).toContain('pdf_export: "unlimited"');
    expect(pkg).toContain('ai_suggestion: "unlimited"');
  });

  it("kartu pricing menyertakan ekspor PDF", () => {
    const card = block(pricing, 'id: "portfolio-web"', "];");
    expect(card).toContain("pricing.feat.pdf-unlimited");
    expect(card).toContain("pricing.feat.ai-portfolio");
  });
});

describe("cv_starter menjadi trial Pro 3 hari yang lebih baik dari gratis", () => {
  it("periode 3 hari, nama trial, dan batas di atas FREE_LIMITS", () => {
    const pkg = block(access, "cv_starter: {", "cv_ai_generate: {");
    expect(pkg).toContain('name: "Coba Pro 3 Hari"');
    expect(pkg).toContain("periodDays: 3");
    expect(pkg).toContain("ai_cv_generate: 10"); // free dapat 2
    expect(pkg).toContain("cv_analyzer: 3"); // free dapat 2
    expect(pkg).toContain('pdf_export: "unlimited"'); // free dapat 2
  });

  it("kartu satuan menampilkan fitur trial, bukan fitur gratis", () => {
    const card = block(pricing, 'id: "cv-starter"', 'id: "cv-ai-generate"');
    expect(card).toContain("pricing.feat.trial-ai");
    expect(card).toContain("pricing.feat.trial-analyzer");
    expect(card).toContain("pricing.feat.3-days");
    expect(card).not.toContain("pricing.feat.1-template");
    expect(card).not.toContain("pricing.feat.form-editor");
  });
});

describe("kartu Free jujur tentang yang didapat gratis", () => {
  it("menampilkan tiga kuota gratis sebagai tersedia, bukan dicoret", () => {
    const card = block(pricing, 'id: "free"', 'id: "starter"');
    expect(card).toContain("pricing.feat.free-ai");
    expect(card).toContain("pricing.feat.free-analyzer");
    expect(card).toContain("pricing.feat.free-portfolio");
    // klaim lama yang menyatakan AI/analyzer/portfolio tidak didapat, hilang
    expect(card).not.toMatch(/pricing\.feat\.ai-gen.*included: false/);
    expect(card).not.toMatch(/pricing\.feat\.portfolio-web.*included: false/);
    expect(card).not.toMatch(/pricing\.feat\.cv-analyzer.*included: false/);
  });

  it("tabel perbandingan free bukan lagi tanda hubung untuk fitur yang diberikan", () => {
    const rows = block(pricing, "COMPARISON_ROW_KEYS", "]");
    expect(rows).toMatch(/compare\.ai-gen.*free: "2x\/bln"/);
    expect(rows).toMatch(/compare\.pdf-export.*free: "2x\/bln"/);
    expect(rows).toMatch(/compare\.analyzer.*free: "2x\/bln"/);
  });
});

describe("bundel tampil sebagai hero di mode langganan", () => {
  it("banner Paket Lamaran ada dan hanya untuk mode langganan", () => {
    expect(pricing).toContain('mode === "langganan" && (');
    expect(pricing).toContain("pricing.bundle.badge");
    expect(pricing).toContain("pricing.bundle.title");
    expect(pricing).toContain("pricing.bundle.cta");
    // Harga banner diambil dari katalog server. Angka Rp49.000 sebagai teks
    // literal pernah membuat harga tampilan melenceng dari yang ditagih.
    expect(pricing).toContain('catalogPrice("bundle_hemat"');
  });

  it("nama paket di master list diganti menjadi Paket Lamaran", () => {
    const pkg = block(access, "bundle_hemat: {", "\n  },");
    expect(pkg).toContain('name: "Paket Lamaran"');
    expect(pkg).toContain('portfolio_web: "unlimited"');
  });

  it("i18n punya kunci copy bundel (id dan en)", () => {
    const i18n = read("src/lib/i18n.tsx");
    for (const k of [
      "pricing.bundle.badge",
      "pricing.bundle.title",
      "pricing.bundle.desc",
      "pricing.bundle.cta",
      "pricing.feat.trial-ai",
      "pricing.feat.free-portfolio",
      "pricing.unit.3-days",
    ]) {
      expect(i18n).toContain(`"${k}"`);
    }
  });
});

describe("migrasi 0024 menutup ketiga paket", () => {
  it("UPDATE tersedia untuk cv_starter, portfolio_web, bundle_hemat", () => {
    for (const key of ["cv_starter", "portfolio_web", "bundle_hemat"]) {
      expect(migration).toContain(`'${key}'`);
    }
    expect(migration).toContain('"key"');
    expect(migration).toContain("period_days");
  });

  it("limits jsonb di migrasi lengkap (bukan merge parsial)", () => {
    const updates = migration.match(/'\{".*?}'/g) ?? [];
    expect(updates.length).toBeGreaterThanOrEqual(3);
    for (const u of updates) {
      expect(u).toContain("pdf_export");
      expect(u).toContain("ai_cv_generate");
    }
  });
});
