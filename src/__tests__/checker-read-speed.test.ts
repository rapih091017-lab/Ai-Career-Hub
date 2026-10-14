import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const extractSrc = readFileSync(join(process.cwd(), "src/app/api/checker/extract/route.ts"), "utf8");
const analyzeSrc = readFileSync(join(process.cwd(), "src/app/api/checker/analyze/route.ts"), "utf8");
const checkerSrc = readFileSync(join(process.cwd(), "src/app/checker/page.tsx"), "utf8");

describe("baca dokumen lebih cepat dan lebih terstruktur", () => {
  it("AnyDoc jadi pembaca pertama untuk PDF dan DOCX", () => {
    // Diuji pada CV PDF asli: 37 ms (AnyDoc) vs 115 ms (pdfjs), dan hasilnya
    // berheading sehingga model lebih jarang salah baca CV dua kolom.
    expect(extractSrc).toContain("docToMarkdown(Buffer.from(rawArrayBuffer))");
    expect(extractSrc).toContain('reader: "anydoc"');
  });

  it("mesin lama tetap ada sebagai cadangan", () => {
    // PDF aneh (xref/font tidak lazim) harus tetap terbaca.
    expect(extractSrc).toContain("extractPdfWithPdfjs");
    expect(extractSrc).toContain("pdf-parse");
  });

  it("halaman yang perlu OCR disebutkan ke pengguna", () => {
    expect(extractSrc).toContain("ocrPages");
  });

  it("pengguna bisa memilih kecepatan analisis", () => {
    // Model berpikir butuh puluhan detik. Tanpa pilihan, pembeli paket
    // hanya bisa menunggu.
    expect(analyzeSrc).toContain('mode === "fast"');
    expect(analyzeSrc).toContain('mode === "deep"');
    expect(checkerSrc).toContain("checker.mode-fast");
    expect(checkerSrc).toContain("checker.mode-deep");
  });

  it("pilihan kecepatan ikut dikirim ke server", () => {
    expect(checkerSrc).toContain("mode: analyzeMode");
  });
});

describe("pengukuran", () => {
  it("berkas uji masih ada untuk perbandingan", () => {
    expect(
      existsSync(join(process.cwd(), "public/M_Teguh_Surya_Susanto_CV_Process_Improvement_Support.pdf")),
    ).toBe(true);
  });
});