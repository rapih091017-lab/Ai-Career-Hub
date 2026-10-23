import { describe, expect, it } from "vitest";
import {
  buildLinkedInResult,
  computeOverallScore,
  gradeFor,
} from "@/lib/linkedin-optimizer/result";

const rawResult = {
  verdict: "Profil sudah jelas arahnya, tapi angka pencapaian masih kosong.",
  sections: [
    { key: "headline", score: 8, issues: ["Belum menyebut fokus"], suggestion: "Sebut React." },
    { key: "about", score: 6, issues: [], suggestion: "Tambah bukti." },
    { key: "experience_titles", score: 7, issues: [], suggestion: "" },
    { key: "experience_descriptions", score: 5, issues: ["Bullet masih tugas"], suggestion: "Hasil dulu." },
    { key: "skills", score: 9, issues: [], suggestion: "" },
    { key: "education", score: 4, issues: [], suggestion: "" },
  ],
  headline: { text: "Frontend Engineer | React", why: "Jelas dan ringkas." },
  about: { text: "Frontend Engineer dengan [angka] tahun pengalaman.", why: "" },
  experience: [
    {
      company: "PT Maju",
      title: "Frontend Engineer",
      period: "Mar 2023 - Sekarang",
      bullets: ["Membangun checkout", "  "],
    },
    { company: "", title: "Tanpa PT", bullets: ["x"] },
  ],
  skills: { text: "Framework: React", note: "" },
};

describe("computeOverallScore", () => {
  it("menghitung rata-rata berbobot dari bagian yang ada", () => {
    // headline 8*25 + about 6*20 + exp_desc 5*25 + titles 7*15 + skills 9*10 + edu 4*5
    // = 200 + 120 + 125 + 105 + 90 + 20 = 660; /100 = 6,6 → 66
    expect(
      computeOverallScore([
        { key: "headline", score: 8 },
        { key: "about", score: 6 },
        { key: "experience_descriptions", score: 5 },
        { key: "experience_titles", score: 7 },
        { key: "skills", score: 9 },
        { key: "education", score: 4 },
      ]),
    ).toBe(66);
  });

  it("menormalisasi bobot saat sebagian bagian tidak ada", () => {
    expect(computeOverallScore([{ key: "headline", score: 10 }])).toBe(100);
  });

  it("skor kosong jadi 0, bukan NaN", () => {
    expect(computeOverallScore([])).toBe(0);
  });
});

describe("gradeFor", () => {
  it("memakai ambang rubrik", () => {
    expect(gradeFor(90)).toBe("A");
    expect(gradeFor(89)).toBe("B");
    expect(gradeFor(75)).toBe("B");
    expect(gradeFor(60)).toBe("C");
    expect(gradeFor(45)).toBe("D");
    expect(gradeFor(44)).toBe("F");
  });
});

describe("buildLinkedInResult", () => {
  it("menyusun hasil lengkap dengan urutan bagian tetap", () => {
    const result = buildLinkedInResult(rawResult);
    expect(result).not.toBeNull();
    expect(result!.overallScore).toBe(66);
    expect(result!.grade).toBe("C");
    expect(result!.sections.map((section) => section.key)).toEqual([
      "headline",
      "about",
      "experience_titles",
      "experience_descriptions",
      "skills",
      "education",
    ]);
  });

  it("membuang pengalaman tanpa perusahaan atau tanpa bullet", () => {
    const result = buildLinkedInResult(rawResult);
    expect(result!.experience).toHaveLength(1);
    expect(result!.experience[0].bullets).toEqual(["Membangun checkout"]);
  });

  it("mengabaikan bagian ganda supaya bobot tidak dihitung dua kali", () => {
    const result = buildLinkedInResult({
      ...rawResult,
      sections: [...rawResult.sections, { key: "headline", score: 0, issues: [], suggestion: "" }],
    });
    const headline = result!.sections.find((section) => section.key === "headline");
    expect(headline?.score).toBe(8);
  });

  it("mengembalikan null kalau tidak ada bagian yang bisa dinilai", () => {
    expect(buildLinkedInResult({ ...rawResult, sections: [] })).toBeNull();
    expect(buildLinkedInResult(null)).toBeNull();
  });

  it("menerima hasil tersimpan yang membawa skor total dan grade", () => {
    const first = buildLinkedInResult(rawResult)!;
    const stored = buildLinkedInResult({ ...first });
    expect(stored).not.toBeNull();
    expect(stored!.overallScore).toBe(first.overallScore);
    expect(stored!.grade).toBe(first.grade);
  });
});
