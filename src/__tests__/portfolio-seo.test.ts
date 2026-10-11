import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("SEO portfolio", () => {
  it("robots.ts ada dan mengizinkan /p/", () => {
    expect(existsSync(join(process.cwd(), "src/app/robots.ts"))).toBe(true);
    const src = read("src/app/robots.ts");
    expect(src).toMatch(/Allow: \/p\//);
    expect(src).toMatch(/Disallow: \/portfolio\/build/);
  });

  it("sitemap menyertakan portfolio published", () => {
    const src = read("src/app/sitemap.ts");
    expect(src).toContain("portfolioPages");
    expect(src).toContain('"published"');
    expect(src).toContain("/p/");
  });

  it("generateMetadata memakai seo, keywords, canonical, dan gambar OG", () => {
    const src = read("src/app/p/[slug]/page.tsx");
    expect(src).toContain("keywords");
    expect(src).toContain("canonical");
    expect(src).toMatch(/images:\s*\[/);
    expect(src).toContain("/api/portfolio/og/");
  });

  it("TitleUpdater tidak menimpa judul di /p/", () => {
    expect(read("src/components/TitleUpdater.tsx")).toMatch(/startsWith\("\/p\/"\)/);
  });

  it("route OG image ada dengan ukuran 1200x630", () => {
    const p = "src/app/api/portfolio/og/[slug]/route.tsx";
    expect(existsSync(join(process.cwd(), p))).toBe(true);
    const src = read(p);
    expect(src).toContain("1200");
    expect(src).toContain("630");
  });

  it("route aset melayani editor sekaligus halaman publik", () => {
    const src = read("src/app/api/portfolio/assets/[id]/route.ts");
    expect(src).not.toContain("withAuth()");
    expect(src).toContain("getServerSession");
    expect(src).toContain("portfolioPages");
    expect(src).toContain("published");
  });
});
