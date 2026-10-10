import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/portfolio/print.css"), "utf8");

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

  it("mengatur ukuran dan margin halaman A4", () => {
    expect(css).toMatch(/@page/);
    expect(css).toMatch(/size:\s*A4/);
  });

  it("hanya berlaku di dalam konteks portfolio cetak", () => {
    // Semua aturan (kecuali @page) di-scope ke [data-pf-print] supaya
    // tidak bocor ke halaman aplikasi lain saat dicetak.
    expect(css).toMatch(/\[data-pf-print\]/);
  });
});
