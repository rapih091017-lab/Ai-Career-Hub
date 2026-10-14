import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const guideSrc = readFileSync(join(process.cwd(), "src/components/profile/LinkedinImportGuide.tsx"), "utf8");
const modalSrc = readFileSync(join(process.cwd(), "src/components/profile/ImportResumeModal.tsx"), "utf8");
const i18nSrc = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");

/**
 * Tautan profil LinkedIn tidak bisa dibaca otomatis karena LinkedIn memblokir
 * akses bot. Yang bisa dilakukan adalah pengguna menyimpan salinannya sendiri,
 * lalu mengunggah. Karena itu langkahnya harus dituntun, bukan sekadar
 *dibuat "paste manual" yang tidak jelas harus berasal dari mana.
 */
describe("impor profil LinkedIn dituntun langkah demi langkah", () => {
  it("panduan menjelaskan dua cara mendapatkan PDF", () => {
    expect(guideSrc).toContain("linkedin.guide-print-title");
    expect(guideSrc).toContain("linkedin.guide-archive-title");
    // Cetak ke PDF: langkah harus menyebut pengaturan privasi, karena profil
    // privat tidak ikut tercetak.
    expect(i18nSrc).toContain("Share profile with others");
    expect(i18nSrc).toContain("Ctrl+P");
    // Arsip data: harus menyebut file Profile.html di dalam zip.
    expect(i18nSrc).toContain("Profile.html");
  });

  it("panduan ada di modal impor profil", () => {
    expect(modalSrc).toContain("<LinkedinImportGuide");
    expect(modalSrc).toContain("fileInputRef.current?.click()");
  });

  it("isian manual tetap ada", () => {
    expect(modalSrc).toContain("profile.import.paste-label");
    expect(modalSrc).toContain("profile.import.paste-placeholder");
  });

  it("PDF profil dibaca lewat server yang hasilnya terstruktur", () => {
    // pdfjs di peramban menghasilkan satu baris panjang; untuk pemetaan ke
    // banyak kolom, struktur dari server jauh lebih akurat.
    expect(modalSrc).toContain("const serverRead = async ()");
    const serverFirst = modalSrc.indexOf("await serverRead()");
    const clientFirst = modalSrc.indexOf("await extractPdfTextClient(file)");
    expect(serverFirst).toBeGreaterThan(-1);
    expect(serverFirst).toBeLessThan(clientFirst);
  });

  it("pdf scan tetap bisa dibaca lewat OCR di peramban", () => {
    expect(modalSrc).toContain("runClientOcr");
  });

  it("popup pengguna baru mengarahkan ke panduan LinkedIn, bukan ke tautan", () => {
    expect(i18nSrc).toContain("Simpan profil LinkedIn-mu jadi PDF");
  });
});