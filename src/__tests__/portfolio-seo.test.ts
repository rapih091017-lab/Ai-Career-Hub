import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import robots from "@/app/robots";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("SEO portfolio", () => {
  it("robots.ts ada dan konfigurasinya mengizinkan /p/ serta aset, memblokir /portfolio/build", () => {
    expect(existsSync(join(process.cwd(), "src/app/robots.ts"))).toBe(true);
    const config = robots();
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    const allow = ([] as string[]).concat(rule.allow ?? []);
    const disallow = ([] as string[]).concat(rule.disallow ?? []);
    expect(allow).toContain("/p/");
    expect(allow).toContain("/api/portfolio/assets/");
    expect(disallow).toContain("/portfolio/build");
  });

  it("hanya baris published yang dibaca halaman /p/ lewat satu query bersama", () => {
    const src = read("src/app/p/[slug]/page.tsx");
    // filter status ada tepat di query cache bersama getPublishedPortfolio
    expect(src).toMatch(
      /const getPublishedPortfolio[\s\S]*?eq\(portfolioPages\.status,\s*"published"\)/,
    );
    // generateMetadata dan komponen page memakai query yang sama — tidak ada
    // kueri kedua yang hanya menyaring slug (itulah yang membuat arsip bocor)
    expect(src.match(/getPublishedPortfolio\(/g) ?? []).toHaveLength(2);
    expect(src).not.toMatch(/\.where\(eq\(portfolioPages\.slug/);
  });

  it("judul fallback memakai heroHeadline dan deskripsi dibatasi 160 karakter", () => {
    const src = read("src/app/p/[slug]/page.tsx");
    expect(src).toContain("${headline} | ${name}");
    expect(src).toContain(".slice(0, 160)");
  });

  it("sitemap menyertakan portfolio published", () => {
    const src = read("src/app/sitemap.ts");
    expect(src).toContain("portfolioPages");
    expect(src).toContain('"published"');
    expect(src).toContain("/p/");
  });

  it("sitemap tidak menyertakan halaman yang diblokir robots", () => {
    const src = read("src/app/sitemap.ts");
    expect(src).not.toContain('/dashboard"');
    // Cocokkan sebagai prefiks, bukan string persis: subpath seperti
    // "/settings/profile" harus ikut ketahuan oleh "Disallow: /settings".
    const rule = Array.isArray(robots().rules) ? robots().rules[0] : robots().rules;
    const disallow = ([] as string[]).concat(rule.disallow ?? []);
    const urls = [...src.matchAll(/BASE_URL\s*\+\s*"([^"]+)"/g)].map((m) => m[1]);
    const terblokir = urls.filter((u) => disallow.some((d) => u.startsWith(d)));
    expect(terblokir).toEqual([]);
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
    expect(src).toContain("await auth()");
    expect(src).not.toContain("as getServerSession");
    expect(src).toContain("portfolioPages");
    expect(src).toContain("published");
  });
});
