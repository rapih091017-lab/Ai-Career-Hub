import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/portfolio/print.css"), "utf8");
const pubPage = readFileSync(join(process.cwd(), "src/app/p/[slug]/page.tsx"), "utf8");
const previewPage = readFileSync(join(process.cwd(), "src/app/portfolio/preview/page.tsx"), "utf8");

describe("print stylesheet", () => {
  it("menyembunyikan lapisan atmosfer saat print", () => {
    expect(css).toMatch(/@media print/);
    expect(css).toMatch(/\.pf-atmosphere/);
    expect(css).toContain("display: none");
  });

  it("memaksa cetak warna", () => {
    expect(css).toContain("print-color-adjust: exact");
  });

  it("menghapus shadow dan blur yang tidak tercetak", () => {
    expect(css).toMatch(/box-shadow:\s*none/);
    expect(css).toMatch(/backdrop-filter:\s*none/);
  });

  it("mencegah kartu terbelah antar halaman", () => {
    expect(css).toMatch(/break-inside:\s*avoid/);
  });

  it("mengatur ukuran dan margin halaman A4 hanya via print entry points", () => {
    // @page tidak bisa di-scope dengan selector, jadi tidak boleh ada di
    // bundle statis (print.css di-share lintas rute). Harus dirender inline
    // hanya di tampilan cetak.
    const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(cssWithoutComments).not.toMatch(/@page/);
    expect(pubPage).toMatch(/@page/);
    expect(previewPage).toMatch(/@page/);
  });

  it("hanya berlaku di dalam konteks portfolio cetak", () => {
    // Semua aturan (kecuali @page) di-scope ke [data-pf-print] supaya
    // tidak bocor ke halaman aplikasi lain saat dicetak.
    expect(css).toMatch(/\[data-pf-print\]/);
  });

  it("menghapus blur juga pada elemen tanpa border-radius inline", () => {
    // GlassContact memakai backdropFilter tanpa borderRadius inline.
    expect(css).toMatch(/\[style\*="backdrop-filter"\]/);
  });

  it("print view /p/[slug] memaksa section motion terlihat", () => {
    // Section di bawah fold punya inline opacity:0 (whileInView); tanpa
    // reveal rule, ?print=1 mencetak halaman kosong.
    expect(pubPage).toContain("STATIC_REVEAL_FALLBACK_CSS");
    expect(pubPage).toMatch(/printMode && \(|printMode \? </);
    expect(pubPage).toMatch(/media="print"/);
  });

  it("print view preview memakai konstanta reveal yang sama", () => {
    expect(previewPage).toContain("STATIC_REVEAL_FALLBACK_CSS");
    expect(previewPage).not.toMatch(/opacity:\s*1 !important/); // tanpa salinan divergen
  });
});
