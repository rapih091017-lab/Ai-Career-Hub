import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  careerHubPostCreateSchema,
  careerHubPostUpdateSchema,
} from "@/lib/career-hub-schemas";

/**
 * Skenario yang benar-benar bisa terjadi di form admin.
 *
 * Regresi: artikel gagal disimpan dengan "Invalid input" berulang kali.
 * Setiap baris di sini adalah penyebab yang pernah ditemukan dan diuji
 * ulang, supaya tidak muncul lagi diam-diam.
 */

const article = {
  title: "Panduan CV ATS untuk Fresh Graduate",
  slug: "panduan-cv-ats-fresh-graduate",
  excerpt: "Cara membuat CV yang terbaca mesin ATS.",
  content: "Isi artikel.",
  category: "cv-ats",
  tags: ["ats"],
};

const scenarios: { name: string; payload: Record<string, unknown> }[] = [
  { name: "artikel paling sederhana", payload: article },
  { name: "tanpa sampul", payload: { ...article, coverImageUrl: null } },
  { name: "sampul kosong", payload: { ...article, coverImageUrl: "" } },
  {
    name: "sampul hasil unggahan (data URL)",
    payload: {
      ...article,
      coverImageUrl: `data:image/jpeg;base64,${"A".repeat(300_000)}`,
    },
  },
  {
    name: "sampul dari URL https",
    payload: { ...article, coverImageUrl: "https://cdn.example.com/cover.jpg" },
  },
  { name: "tanpa slug (dibuat dari judul)", payload: { ...article, slug: "" } },
  { name: "tanpa tag", payload: { ...article, tags: [] } },
  {
    name: "isi dengan penanda format dan daftar",
    payload: {
      ...article,
      content:
        "## Judul\n\n**tebal** dan teks.\n\n1. satu\n2. dua\n\n- butir satu\n\n> kutipan\n\n@center rata tengah",
    },
  },
  { name: "ringkasan dan isi kosong, draf", payload: { ...article, excerpt: "", content: "", status: "draft" } },
  { name: "tag 12 buah", payload: { ...article, tags: Array.from({ length: 12 }, (_, i) => `tag${i}`) } },
  { name: "tag Differens huruf besar", payload: { ...article, tags: ["ATS", "ats"] } },
  { name: "slug huruf besar", payload: { ...article, slug: "Panduan-CV-ATS" } },
];

describe("form admin bisa menyimpan artikel", () => {
  it.each(scenarios)("menerima $name", ({ payload }) => {
    const result = careerHubPostCreateSchema.safeParse(payload);
    const detail = result.success
      ? ""
      : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" | ");
    expect(result.success, `ditolak -> ${detail}`).toBe(true);
  });

  it("menolak gambar dari sumber yang tidak didukung", () => {
    const results = ["bukan-url", "ftp://contoh.com/a.jpg", "javascript:alert(1)"].map(
      (coverImageUrl) => careerHubPostCreateSchema.safeParse({ ...article, coverImageUrl }).success,
    );
    expect(results).toEqual([false, false, false]);
  });

  it("menolak lebih dari 12 tag", () => {
    const tags = Array.from({ length: 13 }, (_, i) => `tag${i}`);
    expect(careerHubCreateWithTags(tags)).toBe(false);
  });

  it("form memotong tag lebih dari 40 karakter sebelum dikirim", () => {
    // Kalau form tidak memotong, server menolak dengan pesan yang tidak
    // menjelaskan apa yang salah. Pemotongan sekarang ada di modul tag.
    const source = readFileSync("src/lib/career-hub-tags.ts", "utf8");
    expect(source).toContain("slice(0, MAX_TAG_LENGTH)");
    // Kolom input boleh lebih panjang dari 40 karakter karena isinya bisa
    // berupa daftar tag yang dipisah koma.
    const form = readFileSync("src/components/career-hub/CareerHubPostForm.tsx", "utf8");
    expect(form).toContain("maxLength={200}");
    expect(form).not.toContain("maxLength={40}");
  });

  it("form memberi batas panjang yang sama dengan server", () => {
    const source = readFileSync("src/components/career-hub/CareerHubPostForm.tsx", "utf8");
    expect(source).toContain("maxLength={180}"); // judul + slug
    expect(source).toContain("maxLength={500}"); // ringkasan
    expect(source).toContain("maxLength={50000}"); // isi
  });

  it("perubahan artikel lewat PATCH tetap diterima", () => {
    expect(careerHubPostUpdateSchema.safeParse({ title: "Judul baru" }).success).toBe(true);
    expect(careerHubPostUpdateSchema.safeParse({ coverImageUrl: null }).success).toBe(true);
    expect(careerHubPostUpdateSchema.safeParse({ tags: ["ats"] }).success).toBe(true);
  });
});

function careerHubCreateWithTags(tags: string[]): boolean {
  return careerHubPostCreateSchema.safeParse({ ...article, tags }).success;
}