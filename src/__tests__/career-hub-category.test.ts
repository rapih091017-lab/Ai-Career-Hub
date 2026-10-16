import { describe, expect, it } from "vitest";
import {
  CAREER_HUB_CATEGORIES,
  careerHubPostCreateSchema,
  careerHubPostUpdateSchema,
  describeFirstIssue,
} from "@/lib/career-hub-schemas";

/**
 * Kategori pernah tersimpan dua bentuk: key ("cv-ats") dari form, dan nama
 * tampilan ("CV dan ATS") dari skrip/import lama. Schema menolak bentuk kedua,
 * dan pesan zod untuk enum yang tidak cocok adalah "Invalid input" — tanpa
 * penjelasan field mana yang salah. Admin lalu mengulang same.ERROR.
 */
describe("kategori artikel dengan dua bentuk nilai", () => {
  const keys = CAREER_HUB_CATEGORIES.map((category) => category.key);

  it("semua kategori punya key dan id yang berbeda", () => {
    for (const category of CAREER_HUB_CATEGORIES) {
      expect(keys).toContain(category.key);
      expect(category.id).not.toBe(category.key);
    }
  });

  it("id kategori tetap diterima lalu diubah jadi key", () => {
    for (const category of CAREER_HUB_CATEGORIES) {
      const result = careerHubPostCreateSchema.safeParse({
        title: "Panduan CV",
        excerpt: "Ringkasan.",
        content: "Isi artikel.",
        category: category.id,
        tags: [],
        status: "draft",
      });
      expect(result.success, `id "${category.id}" ditolak`).toBe(true);
      if (result.success) expect(result.data.category).toBe(category.key);
    }
  });

  it("edit artikel yang kategorinya tersimpan sebagai id tidak ditolak", () => {
    // Ini alur yang dipakai admin: buka artikel lama, lalu simpan ulang.
    const result = careerHubPostUpdateSchema.safeParse({
      title: "CV Kamu Tidak Dibuang Robot",
      category: "CV dan ATS",
      tags: ["ATS"],
      status: "published",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.category).toBe("cv-ats");
  });

  it("kategori yang bukan kategori kita ditolak dengan pesan jelas", () => {
    const result = careerHubPostUpdateSchema.safeParse({
      category: "Kolomom",
      status: "draft",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      expect(message).not.toBe("Invalid input");
      expect(message.toLowerCase()).toContain("kategori");
    }
  });

  it("key kategori yang benar tetap berlaku seperti sebelumnya", () => {
    const result = careerHubPostCreateSchema.safeParse({
      title: "Panduan CV",
      excerpt: "Ringkasan.",
      content: "Isi artikel.",
      category: "cv-ats",
      tags: [],
      status: "draft",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.category).toBe("cv-ats");
  });

  it("isi artikel CV/ATS versi panjang tetap lolos validasi", () => {
    // Regresi: artikel yang benar-benar ditolak admin. Judul berisi tanda
    // kutip, isi berisi penanda format dan tautan, tag berisi spasi.
    const content = [
      'Kamu mungkin pernah dengar: "CV-mu ditolak sistem sebelum dibaca manusia."',
      "",
      "## Apa itu ATS",
      "",
      "ATS adalah singkatan dari Applicant Tracking System, yaitu perangkat lunak.",
      "",
      "1. Pakai satu kolom.",
      "2. Gunakan judul bagian yang umum.",
      "",
      "Cek CV-mu dengan [AI CV Checker](https://aicareerhub.my.id/checker).",
    ].join("\n");
    const result = careerHubPostCreateSchema.safeParse({
      title: 'CV Kamu Tidak "Dibuang Robot". Ini yang Sebenarnya Terjadi di ATS',
      excerpt:
        "ATS sering disalahpahami sebagai robot yang menolak CV. Faktanya lebih sederhana.",
      content,
      category: "cv-ats",
      tags: ["ATS", "CV", "resume", "lamaran kerja"],
      coverImageUrl: null,
      status: "published",
    });
    expect(result.success, result.success ? "" : JSON.stringify(result.error.issues)).toBe(true);
  });
});

describe("pesan error yang sampai ke admin", () => {
  it("menyebut nama kolom saat zod hanya memberi pesan generik", () => {
    const result = careerHubPostUpdateSchema.safeParse({ status: "draft", tags: "ats, cv" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const message = describeFirstIssue(result.error);
    expect(message).toContain("tags");
    expect(message).not.toBe("Invalid input");
  });

  it("pesan milik kita sendiri tidak ditambah nama kolom", () => {
    const result = careerHubPostUpdateSchema.safeParse({ title: "ab", status: "draft" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(describeFirstIssue(result.error)).toBe("Judul minimal 3 karakter.");
  });
});