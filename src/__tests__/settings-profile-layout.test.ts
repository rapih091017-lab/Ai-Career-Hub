import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const layoutSrc = readFileSync(join(process.cwd(), "src/app/settings/layout.tsx"), "utf8");
const profilePageSrc = readFileSync(join(process.cwd(), "src/app/settings/profile/page.tsx"), "utf8");
const oldProfileSrc = readFileSync(join(process.cwd(), "src/app/profile/page.tsx"), "utf8");
const sitemapSrc = readFileSync(join(process.cwd(), "src/app/sitemap.ts"), "utf8");
const accountMenuSrc = readFileSync(join(process.cwd(), "src/components/AccountMenu.tsx"), "utf8");

/**
 * Sidebar "Pengaturan" hilang saat mengisi profil karena halaman profil berada
 * di luar /settings, sehingga tidak ikut layout sidebar. Halaman profil
 * sekarang hidup di dalam layout itu, dan /profile hanya pengalihan.
 */
describe("halaman profil tetap di dalam layout Pengaturan", () => {
  it("halaman profil berada di /settings/profile", () => {
    expect(existsSync(join(process.cwd(), "src/app/settings/profile/page.tsx"))).toBe(true);
  });

  it("halaman profil tidak merender header sendiri", () => {
    // Header dan sidebar datang dari layout /settings. Kalau profil merender
    // keduanya lagi, hasilnya dua header.
    expect(profilePageSrc).not.toContain("<AppHeader />");
    expect(profilePageSrc).not.toContain("<AuthGuard>");
  });

  it("tautan lama /profile dialihkan, bukan hilang", () => {
    expect(oldProfileSrc).toContain('redirect("/settings/profile")');
  });

  it("menu sidebar mengarah ke halaman profil yang benar", () => {
    expect(layoutSrc).toContain('href: "/settings/profile"');
    expect(layoutSrc).not.toContain('href: "/profile"');
  });

  it("menu akun dan halaman lain memakai jalur baru", () => {
    expect(accountMenuSrc).toContain('href: "/settings/profile"');
    expect(accountMenuSrc).not.toContain('href: "/profile"');
  });

  it("halaman privat tidak masuk sitemap", () => {
    expect(sitemapSrc).not.toContain('"/profile"');
    expect(sitemapSrc).not.toContain('"/settings/profile"');
  });
});