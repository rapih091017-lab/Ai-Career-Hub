import { describe, it, expect } from "vitest";
import type { CvData } from "@/components/cv-templates";
import {
  parseAutoFixSuggestions,
  cvToPlainText,
  applyApprovedFixes,
  type AutoFixSuggestion,
} from "@/lib/auto-fix";

// Saran AI tidak boleh merusak teks user. Tes ini mengunci tiga janji:
// saran yang tidak valid dibuang, potongan yang tidak cocok persis
// dilewati, dan data asli tidak dimutasi.

function cvDasar(): CvData {
  return {
    fullName: "Budi Santoso",
    phone: "08123456789",
    email: "budi@example.com",
    address: "Jakarta",
    linkedin: "",
    summary: "Saya seorang staff yang bertanggung jawab untuk mengurusi data.",
    jobTitle: "Frontend Developer",
    jobDescription: "",
    workHistory: [
      {
        id: "w1",
        position: "Staff IT",
        company: "PT Maju",
        location: "",
        startDate: "",
        endDate: "",
        description: "Membuat laporan bulanan untuk atasan.",
      },
    ],
    education: [],
    organisations: [],
    skills: [{ id: "s1", name: "React", level: "intermediate" }],
  } as CvData;
}

describe("parseAutoFixSuggestions", () => {
  it("menerima saran valid dan membuang yang tidak valid", () => {
    const raw = {
      suggestions: [
        {
          id: "s1",
          type: "replace_text",
          target: "summary",
          original: "mengurusi data",
          replacement: "mengelola data",
          category: "bahasa",
          reason: "Diksi lebih formal",
        },
        { id: "rusak", type: "replace_text", target: "summary" },
        {
          id: "s2",
          type: "add_skill",
          name: "TypeScript",
          category: "kata_kunci",
          reason: "Ada di lowongan",
        },
        "bukan-objek",
      ],
    };
    const hasil = parseAutoFixSuggestions(raw);
    expect(hasil.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("mengembalikan array kosong untuk respons rusak", () => {
    expect(parseAutoFixSuggestions(null)).toEqual([]);
    expect(parseAutoFixSuggestions({})).toEqual([]);
    expect(parseAutoFixSuggestions({ suggestions: "acak" })).toEqual([]);
  });
});

describe("cvToPlainText", () => {
  it("memuat nama, ringkasan, pengalaman, dan keahlian", () => {
    const teks = cvToPlainText(cvDasar());
    expect(teks).toContain("Budi Santoso");
    expect(teks).toContain("mengurusi data");
    expect(teks).toContain("Staff IT - PT Maju");
    expect(teks).toContain("Membuat laporan bulanan");
    expect(teks).toContain("React");
  });
});

describe("applyApprovedFixes", () => {
  it("menerapkan perbaikan ringkasan dan bullet pengalaman", () => {
    const cv = cvDasar();
    const saran: AutoFixSuggestion[] = [
      {
        id: "s1",
        type: "replace_text",
        target: "summary",
        original: "mengurusi data",
        replacement: "mengelola data",
        category: "bahasa",
        reason: "",
      },
      {
        id: "s2",
        type: "replace_text",
        target: "experience",
        index: 0,
        original: "Membuat laporan bulanan untuk atasan.",
        replacement: "Menyusun laporan bulanan untuk [jumlah orang] pemangku kepentingan.",
        category: "bullet",
        reason: "",
      },
      {
        id: "s3",
        type: "add_skill",
        name: "TypeScript",
        category: "kata_kunci",
        reason: "",
      },
    ];
    const hasil = applyApprovedFixes(cv, saran);
    expect(hasil.summary).toContain("mengelola data");
    expect(hasil.workHistory[0].description).toContain("[jumlah orang]");
    expect(hasil.skills.map((s) => s.name)).toContain("TypeScript");
    // Data asli tidak dimutasi.
    expect(cv.summary).toContain("mengurusi data");
  });

  it("melewati saran yang potongan aslinya tidak ditemukan persis", () => {
    const cv = cvDasar();
    const hasil = applyApprovedFixes(cv, [
      {
        id: "s1",
        type: "replace_text",
        target: "summary",
        original: "kalimat yang tidak ada",
        replacement: "pengganti",
        category: "bahasa",
        reason: "",
      },
    ]);
    expect(hasil.summary).toBe(cv.summary);
  });

  it("tidak menduplikasi keahlian yang sudah ada (abaikan huruf besar)", () => {
    const cv = cvDasar();
    const hasil = applyApprovedFixes(cv, [
      { id: "s1", type: "add_skill", name: "react", category: "kata_kunci", reason: "" },
    ]);
    expect(hasil.skills.filter((s) => s.name.toLowerCase() === "react")).toHaveLength(1);
  });
});

describe("applyApprovedFixes: deskripsi tetap satu poin per baris", () => {
  it("pengganti bernomor dipecah jadi poin, saran berikutnya tetap cocok", async () => {
    const { applyApprovedFixes } = await import("@/lib/auto-fix");
    const { normalizeCvDocument } = await import("@/lib/cv-normalize");
    const cv = normalizeCvDocument({
      tailoredContent: { workHistory: [{ id: "w1", description: "- Bikin laporan\n- Urus stok" }] },
    });
    const next = applyApprovedFixes(cv, [
      { id: "a", type: "replace_text", target: "experience", index: 0, original: "Bikin laporan", replacement: "1. Menyusun laporan 2. Mengirim laporan", category: "bullet", reason: "" },
      { id: "b", type: "replace_text", target: "experience", index: 0, original: "- Urus stok", replacement: "• Mengelola stok", category: "bullet", reason: "" },
    ]);
    expect(next.workHistory[0].description).toBe("Menyusun laporan\nMengirim laporan\nMengelola stok");
  });
});

describe("applyApprovedFixes: add_skill", () => {
  it("level tidak dipaksa intermediate dan id memakai newId", async () => {
    const { applyApprovedFixes } = await import("@/lib/auto-fix");
    const { normalizeCvDocument } = await import("@/lib/cv-normalize");
    const cv = normalizeCvDocument({ tailoredContent: {} });
    const next = applyApprovedFixes(cv, [
      { id: "k", type: "add_skill", name: "Docker", category: "kata_kunci", reason: "" },
      { id: "l", type: "add_skill", name: "Excel", category: "kata_kunci", reason: "" },
    ]);
    expect(next.skills.map((s) => s.level)).toEqual(["", ""]);
    expect(next.skills[0].id).toMatch(/^sk_/);
    expect(next.skills[0].id).not.toBe(next.skills[1].id);
  });
});
