import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("konsumen PortfolioDocument", () => {
  it("preview memakai sectionOrder, bukan daftar hardcoded", () => {
    const src = read("src/app/portfolio/preview/page.tsx");
    expect(src).toContain("PortfolioDocument");
    expect(src).toContain("sectionOrder=");
    expect(src).toContain("sectionVisibility=");
    expect(src).not.toMatch(/from "@\/components\/portfolio\/sections\//);
  });

  it("halaman publik memakai mode static", () => {
    expect(read("src/app/p/[slug]/page.tsx")).toContain('mode="static"');
  });

  it("canvas builder memakai mode editor dan meneruskan onSectionClick", () => {
    const src = read("src/components/portfolio/PortfolioCanvas.tsx");
    expect(src).toContain('mode="editor"');
    expect(src).toContain("onSectionClick=");
  });

  it("canvas builder tidak lagi mengimpor 12 section langsung", () => {
    const src = read("src/components/portfolio/PortfolioCanvas.tsx");
    expect(src.match(/portfolio\/sections\//g)?.length ?? 0).toBeLessThanOrEqual(1);
  });
});
