import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sanitizeExtractedText } from "@/lib/checker/extracted-text";

/**
 * Teks hasil ekstraksi PDF bisa memuat byte NUL (0x00) yang lolos dari pustaka
 * pembaca PDF. Kolom `text` di Postgres menolak byte itu dengan error 22021
 * ("invalid byte sequence for encoding UTF8: 0x00"), sehingga insert
 * checker_results gagal dan pengguna cuma melihat "Terjadi kesalahan server"
 * padahal analisis AI-nya sendiri sudah selesai.
 */
describe("pembersihan teks hasil ekstraksi", () => {
  it("buang karakter NUL di tengah teks", () => {
    const hasil = sanitizeExtractedText("pimpin tim\u0000membangun dashboard");
    expect(hasil).toBe("pimpin timmembangun dashboard");
    expect(hasil.includes("\u0000")).toBe(false);
  });

  it("buang beberapa NUL sekaligus", () => {
    expect(sanitizeExtractedText("a\u0000b\u0000c")).toBe("abc");
  });

  it("teks bersih tidak diubah sama sekali", () => {
    const bersih = "Budi Santoso\nSoftware Engineer\n3 tahun React";
    expect(sanitizeExtractedText(bersih)).toBe(bersih);
  });

  it("spasi dan baris baru tetap dipertahankan", () => {
    expect(sanitizeExtractedText("baris 1\n\nbaris 2   di sini")).toBe("baris 1\n\nbaris 2   di sini");
  });

  it("kosong tetap kosong", () => {
    expect(sanitizeExtractedText("")).toBe("");
    expect(sanitizeExtractedText("\u0000\u0000")).toBe("");
  });

  it("karakter kontrol lain dibiarkan — Postgres hanya menolak NUL", () => {
    // Tab dan newline harus utuh, dan karakter control lain tidak boleh
    // dibuang begitu saja karena bisa memotong isi CV pengguna.
    expect(sanitizeExtractedText("tab\there\nnewline")).toBe("tab\there\nnewline");
  });
});

describe("kedua jalur tepercaya memakai pembersih yang sama", () => {
  const analyze = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");
  const extract = readFileSync("src/app/api/checker/extract/route.ts", "utf8");

  it("route analisis membersihkan teks sebelum masuk base data", () => {
    // Tanpa ini, insert checker_results melempar PostgresError 22021.
    expect(analyze).toContain("sanitizeExtractedText");
    // Pembersihan harus terjadi sebelum `cvTextExtracted` diisi.
    const posisiPakai = analyze.indexOf("cvTextExtracted:");
    const posisiBersih = analyze.indexOf("sanitizeExtractedText");
    expect(posisiBersih).toBeGreaterThan(-1);
    expect(posisiBersih).toBeLessThan(posisiPakai);
  });

  it("route ekstraksi mengirim teks yang sudah bersih ke pengguna", () => {
    // Pengguna memakai teks ini untuk analisis berikutnya lewat jalur paste.
    expect(extract).toContain("sanitizeExtractedText");
  });
});