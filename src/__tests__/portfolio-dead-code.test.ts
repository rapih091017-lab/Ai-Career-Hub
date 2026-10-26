import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const p = (f: string) => join(process.cwd(), f);

describe("kode mati dan copy basi", () => {
  it("html-generators.ts sudah dihapus", () => {
    expect(existsSync(p("src/components/portfolio-templates/html-generators.ts"))).toBe(false);
  });

  it("portfolioTemplates.ts sudah dihapus", () => {
    expect(existsSync(p("src/lib/portfolioTemplates.ts"))).toBe(false);
  });

  it("tidak ada berkas yang mengimpor portfolio-templates/html-generators", () => {
    const files = [
      "src/components/FeatureTabs.tsx",
      "src/components/PortfolioSpotlight.tsx",
      "src/app/portfolio/page.tsx",
    ];
    for (const f of files) {
      expect(read(f)).not.toContain("html-generators");
      expect(read(f)).not.toContain("PORTFOLIO_TEMPLATES");
    }
  });

  it("field mati heroBgUrl dan heroCreativeTitle sudah hilang dari tipe, schema, form, dan render", () => {
    const files = [
      "src/components/portfolio-templates/types.ts",
      "src/lib/portfolio/schema.ts",
      "src/components/portfolio/render/PortfolioDocument.tsx",
      "src/components/portfolio/builder/BuilderEditor.tsx",
      "src/app/portfolio/build/page.tsx",
    ];
    for (const f of files) {
      expect(read(f)).not.toContain("heroBgUrl");
      expect(read(f)).not.toContain("heroCreativeTitle");
    }
  });

  it("copy tema di landing memakai nama tema yang nyata", () => {
    for (const f of ["src/components/FeatureTabs.tsx", "src/components/PortfolioSpotlight.tsx"]) {
      const src = read(f);
      expect(src).not.toContain("Modern Slate");
      expect(src).not.toContain("Minimal Dark");
      expect(src).not.toContain("Modern Blue");
      expect(src).toContain('from "@/components/portfolio/themes"');
      expect(src).toMatch(/Object\.values\((?:PORTFOLIO_)?THEMES\)/);
      expect(src).toContain("{theme.name}");
    }
  });

  it("copy builder sertifikat/organisasi/hobi memakai t(), bukan string keras", () => {
    const src = read("src/components/portfolio/builder/BuilderEditor.tsx");
    for (const hardcoded of [
      'title="Sertifikat & Penghargaan"',
      'title="Organisasi & Kepanitiaan"',
      'title="Hobi & Minat"',
      'label="Nama Sertifikat"',
      'label="Penerbit"',
      'label="Tahun"',
      'label="Link Sertifikat (opsional)"',
      'label="Nama Organisasi"',
      'label="Peran / Jabatan"',
      'label="Deskripsi Kegiatan"',
      'label="Nama Hobi"',
      "Tambah Sertifikat",
      "Tambah Organisasi",
      "Tambah Hobi",
    ]) {
      expect(src).not.toContain(hardcoded);
    }
  });

  it("PublishedPortfolio (wrapper khusus test) sudah dihapus", () => {
    expect(existsSync(p("src/components/portfolio/PublishedPortfolio.tsx"))).toBe(false);
    expect(read("src/__tests__/portfolio-document.test.tsx")).not.toContain("PublishedPortfolio");
    expect(read("src/__tests__/portfolio-schema.test.ts")).not.toContain("PublishedPortfolio");
  });
});
