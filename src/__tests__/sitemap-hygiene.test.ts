import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sitemapSrc = readFileSync(join(process.cwd(), "src/app/sitemap.ts"), "utf8");
const robotsSrc = readFileSync(join(process.cwd(), "src/app/robots.ts"), "utf8");

/** Prefix yang robots.txt tolak. Halaman-halaman ini tidak boleh muncul
 *  di sitemap: Google mengabaikan URL yang di-disallow, tapi mendaftarkannya
 *  hanya menambah kebisingan. */
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/settings",
  "/portfolio/build",
  "/portfolio/live",
  "/portfolio/preview",
  "/api/",
];

describe("sitemap: hanya halaman publik", () => {
  it("tidak mendaftarkan halaman yang dilarang robots.txt", () => {
    for (const prefix of PRIVATE_PREFIXES) {
      expect(sitemapSrc, `sitemap mendaftarkan ${prefix}`).not.toContain(`BASE_URL + "${prefix}"`);
    }
  });

  it("tidak mendaftarkan halaman utilitas tanpa nilai SEO", () => {
    for (const util of ["/login", "/builder/new"]) {
      expect(sitemapSrc, `sitemap mendaftarkan ${util}`).not.toContain(`BASE_URL + "${util}"`);
    }
  });

  it("tetap mendaftarkan halaman konten utama", () => {
    for (const page of ["/checker", "/interview", "/contoh-cv", "/career-hub", "/about", "/faq", "/privacy"]) {
      expect(sitemapSrc, `sitemap kehilangan ${page}`).toContain(`BASE_URL + "${page}"`);
    }
  });

  it("robots.txt tetap menutup halaman privat", () => {
    for (const prefix of ["/dashboard", "/settings", "/api/"]) {
      expect(robotsSrc, `robots.txt tidak menutup ${prefix}`).toContain(`"${prefix}"`);
    }
  });
});