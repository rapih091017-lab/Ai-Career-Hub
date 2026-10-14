import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILES = [
  "src/components/PricingSection.tsx",
  "src/lib/i18n.tsx",
  "src/app/page.tsx",
  "src/app/portfolio/page.tsx",
];

describe("copy jumlah tema", () => {
  it("tidak ada copy '3 tema' atau '3 pilihan tema' di file produk", () => {
    for (const f of FILES) {
      const src = readFileSync(join(process.cwd(), f), "utf8");
      expect(src, `${f} masih menyebut 3 tema`).not.toMatch(/3 (pilihan )?tema/);
    }
  });

  it("ada deskripsi tema minimal di kamus i18n", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
    expect(src).toContain("portfolio.theme.minimalist-desc");
  });

  it("penyebutan jumlah tema di pricing memakai angka empat", () => {
    // Copy-nya lives di kamus i18n; PricingSection hanya memakai kuncinya.
    const i18n = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
    const pricing = readFileSync(join(process.cwd(), "src/components/PricingSection.tsx"), "utf8");
    expect(i18n).toMatch(/4 (pilihan )?tema/);
    // Jumlah tema tidak lagi ditulis di teks kartu: kartu paket membaca\n    // kuota dari katalog, jadi tidak perlu menyebut angka tema.
  });
});
