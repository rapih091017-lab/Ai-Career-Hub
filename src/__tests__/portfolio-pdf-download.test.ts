import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const previewSrc = readFileSync(join(process.cwd(), "src/app/portfolio/preview/page.tsx"), "utf8");
const pdfRouteSrc = readFileSync(join(process.cwd(), "src/app/api/export-pdf-v2/route.ts"), "utf8");
const vercelJson = readFileSync(join(process.cwd(), "vercel.json"), "utf8");

/**
 * Ekspor PDF portfolio memanggil `window.print()`, jadi yang muncul adalah dialog
 * cetak Windows, bukan file PDF yang terunduh.
 */
describe("ekspor PDF portfolio mengunduh file, bukan membuka dialog cetak", () => {
  it("tombol Simpan PDF memanggil unduhan PDF", () => {
    expect(previewSrc).toContain("downloadPdf");
    expect(previewSrc).toContain("/api/export-pdf-v2");
    expect(previewSrc).toContain(".pdf");
  });

  it("tombol khusus cetak tetap tersedia untuk mencetak manual", () => {
    // Cetak manual tetap ada, tapi tidak lagi jadi satu-satunya jalan.
    expect(previewSrc).toContain("window.print()");
  });

  it("server PDF punya kuota dan pesan error yang jelas", () => {
    expect(pdfRouteSrc).toContain('checkQuota(userId, "pdf_export")');
    expect(previewSrc).toContain("preview.pdf-error");
  });

  it("fungsi server PDF diberi memori dan durasi yang cukup untuk Chromium", () => {
    // Tanpa ini, Chromium gagal start di Vercel dan semua export jatuh ke
    // dialog cetak.
    expect(vercelJson).toContain("src/app/api/export-pdf-v2/route.ts");
    expect(vercelJson).toMatch(/"memory":\s*1024/);
    expect(vercelJson).toMatch(/"maxDuration":\s*60/);
    expect(pdfRouteSrc).toContain("maxDuration");
  });
});