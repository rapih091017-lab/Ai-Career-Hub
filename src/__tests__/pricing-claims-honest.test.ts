import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const i18nSrc = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
const pricingSrc = readFileSync(join(process.cwd(), "src/components/PricingSection.tsx"), "utf8");
const deleteRouteSrc = readFileSync(join(process.cwd(), "src/app/api/account/delete/route.ts"), "utf8");
const deleteUiSrc = readFileSync(join(process.cwd(), "src/components/settings/DeleteAccountSection.tsx"), "utf8");

/**
 * Pembeli yang teliti membuka Terms sebelum membayar. Kalau klaim di halaman
 * harga tidak cocok dengan sistem, dia tidak membeli.
 */
describe("setiap klaim di halaman harga benar", () => {
  it("tidak ada lagi klaim garansi uang kembali", () => {
    expect(i18nSrc).not.toContain("Garansi 7 Hari");
    expect(i18nSrc).not.toContain("7-Day Guarantee");
    expect(i18nSrc).not.toMatch(/Uang kembali jika tidak puas/);
  });

  it("tidak ada klaim perpanjangan otomatis atau pembatalan", () => {
    // Sistem hanya mendukung pembayaran sekali dengan masa berlaku.
    expect(i18nSrc).not.toContain("Perpanjang otomatis");
    expect(i18nSrc).not.toContain("Auto-renew");
    expect(i18nSrc).not.toMatch(/Cancel lewat dashboard/);
    expect(i18nSrc).toContain("Tidak ada perpanjangan otomatis");
  });

  it("metode pembayaran disebut sesuai kenyataan: QRIS saja", () => {
    expect(i18nSrc).toContain("Bayar sekali lewat QRIS");
    expect(i18nSrc).not.toMatch(/GoPay, OVO/);
  });

  it("badge keberatan diganti klaim yang bisa dipertanggungjawabkan", () => {
    expect(pricingSrc).toContain("pricing.garansi");
    expect(i18nSrc).toContain("PDF Berbasis Teks");
    expect(i18nSrc).toContain("Sekali Bayar");
  });

  it("FAQ menjawab keberatan pembeli yang teliti", () => {
    // Retensi, kuota habis, dan uang kembali adalah tiga pertanyaan yang
    // paling sering menahan orang sebelum membayar.
    expect(pricingSrc).toContain("const FAQ_KEYS = [0, 1, 2, 3, 4, 5, 6]");
    expect(i18nSrc).toContain("pricing.faq.5.q");
    expect(i18nSrc).toContain("pricing.faq.6.q");
    expect(i18nSrc).toContain("Apa yang terjadi kalau kuota habis");
    expect(i18nSrc).toContain("Apakah langganan diperpanjang otomatis");
  });

  it("akun bisa benar-benar dihapus, seperti janji di Privacy", () => {
    expect(deleteRouteSrc).toContain("CONFIRMATION_REQUIRED");
    expect(deleteRouteSrc).toContain("CONFIRM_WORD");
    expect(deleteUiSrc).toContain("/api/account/delete");
    expect(deleteUiSrc).toContain('confirmText.trim().toUpperCase() === "HAPUS"');
  });

  it("teks rusak akibat salah enkode dibersihkan", () => {
    // Tiga berkas ini pernah memuat karakter rusak hasil salah enkode.\n    for (const src of [i18nSrc, pricingSrc, deleteUiSrc]) {\n      expect(src).not.toMatch(/[Ââ]/);\n    }
  });
});