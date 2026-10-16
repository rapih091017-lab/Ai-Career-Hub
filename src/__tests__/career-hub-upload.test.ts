import { describe, it, expect } from "vitest";
import { careerHubPostCreateSchema } from "@/lib/career-hub-schemas";

/**
 * Reproduksi: artikel gagal disimpan dengan "Invalid input" setelah admin
 * mengunggah gambar sampul.
 *
 * PhotoUpload menyimpan gambar sebagai data URL (base64), sama seperti
 * lowongan dan portofolio. Data URL 200 KB sudah jauh melewati batas 2048
 * karakter, jadi artikel yang gambarnya sudah diunggah tidak bisa disimpan.
 */

const base = {
  title: "Panduan CV ATS untuk Fresh Graduate",
  slug: "panduan-cv-ats-fresh-graduate",
  excerpt: "Cara membuat CV yang terbaca mesin ATS.",
  content: "Isi artikel.\n\n1. Poin pertama\n2. Poin kedua",
  category: "cv-ats",
  tags: ["ats"],
};

/** Data URL seperti yang dihasilkan PhotoUpload untuk gambar 200 KB. */
function dataUrl(sizeBytes: number): string {
  const payload = "A".repeat(Math.ceil((sizeBytes * 4) / 3));
  return `data:image/jpeg;base64,${payload}`;
}

describe("gambar sampul artikel", () => {
  it("menerima gambarsampul dari unggahan (data URL)", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      coverImageUrl: dataUrl(200_000),
    });
    const message = result.success ? "" : result.error.issues[0].message;
    expect(result.success, `ditolak: ${message}`).toBe(true);
  });

  it("menerima data URL kecil juga", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      coverImageUrl: dataUrl(1_000),
    });
    expect(result.success).toBe(true);
  });

  it("tetap menolak URL yang rusak", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      coverImageUrl: "bukan-url",
    });
    expect(result.success).toBe(false);
  });

  it("tetap menolak gambar yang bukan http dan bukan data URL", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      coverImageUrl: "ftp://contoh.com/gambar.jpg",
    });
    expect(result.success).toBe(false);
  });
});

describe("penanda format di isi artikel", () => {
  it("isi dengan daftar dan penanda format tetap diterima", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      content:
        "## Judul bagian\n\n**Teks tebal** di sini.\n\n1. Poin pertama\n2. Poin kedua\n\n@center Kalimat rata tengah",
    });
    expect(result.success).toBe(true);
  });

  it("isi sepanjang batas tetap diterima", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      content: "x".repeat(50_000),
    });
    expect(result.success).toBe(true);
  });
});

describe("tag artikel", () => {
  it("menolak tag yang terlalu panjang dengan pesan jelas", () => {
    const result = careerHubPostCreateSchema.safeParse({
      ...base,
      tags: ["a".repeat(41)],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/40/);
    }
  });

  it("menerima 12 tag", () => {
    const tags = Array.from({ length: 12 }, (_, index) => `tag-${index}`);
    expect(careerHubPostCreateSchema.safeParse({ ...base, tags }).success).toBe(true);
  });

  it("menolak 13 tag", () => {
    const tags = Array.from({ length: 13 }, (_, index) => `tag-${index}`);
    expect(careerHubPostCreateSchema.safeParse({ ...base, tags }).success).toBe(false);
  });
});