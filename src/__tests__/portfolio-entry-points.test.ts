import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("entry point builder", () => {
  it("halaman build/[draftId] ada", () => {
    expect(existsSync(join(process.cwd(), "src/app/portfolio/build/[draftId]/page.tsx"))).toBe(true);
  });

  it("live builder menjadi pengalihan, bukan editor kedua", () => {
    const src = read("src/app/portfolio/live/page.tsx");
    expect(src).toContain("router.replace");
    expect(src).not.toContain("portfolio_live_data");
  });

  it("tidak ada lagi kunci localStorage lama", () => {
    const files = [
      "src/app/portfolio/build/page.tsx",
      "src/app/portfolio/live/page.tsx",
      "src/app/portfolio/preview/page.tsx",
      "src/components/portfolio/builder/BuilderEditor.tsx",
    ];
    for (const f of files) {
      const src = read(f);
      expect(src).not.toContain('"portfolio_draft"');
      expect(src).not.toContain('"portfolio_live_data"');
    }
  });

  it("halaman portfolio tidak lagi menawarkan tombol Live Builder", () => {
    expect(read("src/app/portfolio/page.tsx")).not.toContain("/portfolio/live");
  });
});

describe("panel tampilan builder dan rantai alignment", () => {
  it("BuilderEditor memuat kontrol urutan, visibilitas, fontSize, dan alignment", () => {
    const src = read("src/components/portfolio/builder/BuilderEditor.tsx");
    expect(src).toContain('t("live.section-order")');
    expect(src).toContain('t("live.font-size")');
    expect(src).toContain('t("live.text-align")');
    expect(src).toContain('t("live.appearance")');
    expect(src).toContain("moveSection");
    expect(src).toContain("toggleSectionVisible");
    expect(src).toContain("setSectionAlignment");
    expect(src).toContain("setAppearanceFontSize");
  });

  it("BuilderEditor menyediakan aksi Draft baru", () => {
    const src = read("src/components/portfolio/builder/BuilderEditor.tsx");
    expect(src).toContain('t("build.new-draft")');
    expect(src).toContain('method: "POST"');
    expect(src).toContain("portfolioDataSchema.parse");
  });

  it("Draft baru mem-flush perubahan tertunda sebelum POST", () => {
    const src = read("src/components/portfolio/builder/BuilderEditor.tsx");
    const blok = src.match(/const createNewDraft = async[\s\S]*?\n  \};/)?.[0] ?? "";
    expect(blok).toContain("draft.flushNow()");
    expect(blok.indexOf("flushNow")).toBeLessThan(blok.indexOf('method: "POST"'));
  });

  it("creator memakai helper migrasi dan aturan hapus legacy", () => {
    const src = read("src/app/portfolio/build/page.tsx");
    expect(src).toContain("migrateLegacyPayload(");
    expect(src).toContain("shouldClearLegacy(");
    expect(src).not.toContain("safeParse(legacy)");
  });

  it("empty state preview menyebut builder, bukan Live Builder", () => {
    const i18n = read("src/lib/i18n.tsx");
    const baris = i18n
      .split("\n")
      .filter((l) => l.includes("preview.no-draft-desc") || l.includes("preview.open-builder"));
    expect(baris).toHaveLength(2);
    for (const line of baris) expect(line).not.toContain("Live Builder");
  });

  it("preview dan halaman publik meneruskan sectionStyle dari alignment", () => {
    const preview = read("src/app/portfolio/preview/page.tsx");
    expect(preview).toContain("alignmentToSectionStyle");
    expect(preview.match(/sectionStyle=\{/g)?.length).toBeGreaterThanOrEqual(2);
    const published = read("src/app/p/[slug]/page.tsx");
    expect(published).toContain("alignmentToSectionStyle");
    expect(published).toContain("sectionStyle=");
  });

  it("rantai alignment lengkap: schema, tipe data, dan merge publish", () => {
    const schema = read("src/lib/portfolio/schema.ts");
    expect(schema).toContain("alignment: z.partialRecord(z.enum(SECTION_IDS), z.enum([\"left\", \"center\", \"right\"])).optional()");
    const types = read("src/components/portfolio-templates/types.ts");
    expect(types).toContain('alignment?: Record<string, "left" | "center" | "right">');
    const publishRoute = read("src/app/api/portfolio/publish/route.ts");
    expect(publishRoute).toContain("data.alignment");
  });
});
