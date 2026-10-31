import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { clampMarkdown, MAX_MARKDOWN_CHARS } from "@/lib/doc-markdown";

const builderSrc = readFileSync(join(process.cwd(), "src/app/builder/[id]/page.tsx"), "utf8");
const extractSrc = readFileSync(join(process.cwd(), "src/app/api/checker/extract/route.ts"), "utf8");
const adapterSrc = readFileSync(join(process.cwd(), "src/lib/ai/adapter.ts"), "utf8");
const importSrc = readFileSync(join(process.cwd(), "src/app/api/profile/import/route.ts"), "utf8");

describe("ekspor CV memakai route PDF server dari renderer pratinjau", () => {
  it("builder flush autosave lalu memanggil route PDF CV", () => {
    expect(builderSrc).toContain("flushAutoSave()");
    expect(builderSrc).toContain("/pdf`");
    expect(builderSrc).not.toContain("downloadCvPdf");
    expect(builderSrc).not.toContain("window.print()");
  });

  it("pratinjau dan PDF memakai format yang sama", () => {
    expect(builderSrc).toContain("cvRenderProps(cvData, printFormat");
    expect(builderSrc).toContain("JSON.stringify({ format: printFormat, expectedUpdatedAt");
  });
});

describe("DOCX dibaca dengan AnyDoc", () => {
  it("ekstraksi DOCX memakai AnyDoc, bukan mammoth", () => {
    expect(extractSrc).toContain("docToMarkdown");
    expect(extractSrc).not.toContain("mammoth");
  });

  it("dokumen hasil pindaian dijelaskan, bukan gagal diam-diam", () => {
    expect(extractSrc).toContain("DOKUMEN_PERLU_OCR");
    expect(extractSrc).toContain("SCANNED_DOCX");
  });

  it("potongan teks selalu ditandai", () => {
    const short = clampMarkdown("a".repeat(100));
    expect(short.truncated).toBe(false);
    const long = clampMarkdown("a".repeat(MAX_MARKDOWN_CHARS + 500));
    expect(long.truncated).toBe(true);
    expect(long.text).toContain("dipotong");
  });

  it("impor profil memberi tahu kalau teks terpotong", () => {
    expect(importSrc).toContain("clampMarkdown");
    expect(importSrc).not.toContain("text.slice(0, MAX_TEXT_LENGTH)");
  });
});

describe("unggahan dan panggilan AI dibatasi", () => {
  it("route ekstraksi menolak berkas melebihi batas", () => {
    expect(extractSrc).toContain("MAX_UPLOAD_BYTES");
    expect(extractSrc).toContain("FILE_TOO_LARGE");
  });

  it("PDF dengan halaman berlebihan ditolak", () => {
    expect(extractSrc).toContain("MAX_PDF_PAGES");
  });

  it("retry AI menunggu lebih lama tiap percobaan", () => {
    // Retry tanpa jeda memukul rate limit lagi dan berakhir 502.
    expect(adapterSrc).toContain("400 * 2 ** attempt");
    expect(adapterSrc).toContain("setTimeout");
  });

  it("output AI yang terpotong tidak diulang dua kali", () => {
    expect(adapterSrc).toContain('finish_reason === "length"');
  });
});