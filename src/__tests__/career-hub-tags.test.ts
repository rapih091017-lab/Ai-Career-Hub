import { describe, expect, it } from "vitest";
import { mergeTags, parseTagInput } from "@/lib/career-hub-tags";

describe("tag yang diketik admin", () => {
  it("tag dipisah koma dipecah jadi beberapa tag", () => {
    // Mengetik "lowongan palsu, penipuan kerja, tips aman" pernah
    // disimpan sebagai satu tag berisi koma, sehingga halaman tag publik
    // memakai nama aneh dan URL rusak.
    expect(parseTagInput("lowongan palsu, penipuan kerja, tips aman")).toEqual([
      "lowongan palsu",
      "penipuan kerja",
      "tips aman",
    ]);
  });

  it("koma, spasi, dan baris baru 모두 jadi pemisah", () => {
    expect(parseTagInput("ATS,\nCV , resume\nlamaran")).toEqual([
      "ATS",
      "CV",
      "resume",
      "lamaran",
    ]);
  });

  it("tanda pagar di awal tag dibuang", () => {
    expect(parseTagInput("#ATS, #CV")).toEqual(["ATS", "CV"]);
  });

  it("bagian kosong diabaikan", () => {
    expect(parseTagInput("ATS, ,, , ,CV,")).toEqual(["ATS", "CV"]);
    expect(parseTagInput("   ")).toEqual([]);
    expect(parseTagInput(",,,")).toEqual([]);
  });

  it("tag dipangkas ke batas server", () => {
    const long = "a".repeat(60);
    expect(parseTagInput(long)).toEqual(["a".repeat(40)]);
  });

  it("maksimal 12 tag sesuai batas server", () => {
    const input = Array.from({ length: 20 }, (_, i) => `tag${i + 1}`).join(", ");
    expect(parseTagInput(input)).toHaveLength(12);
  });

  it("tag duplikat tidak diulang", () => {
    expect(parseTagInput("ATS, ats, CV")).toEqual(["ATS", "CV"]);
  });

  it("tag yang sudah ada tidak ditambah dua kali", () => {
    // Fungsi addTag di form akan menggabungkan hasil ini dengan tag lama.
    expect(mergeTags(["ATS", "CV"], "CV, resume")).toEqual(["ATS", "CV", "resume"]);
  });
});