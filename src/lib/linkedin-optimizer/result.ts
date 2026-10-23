import {
  LINKEDIN_SECTION_KEYS,
  LinkedInOptimizerResultSchema,
} from "@/lib/ai/prompts/schemas";

/**
 * Penyusun hasil LinkedIn Optimizer untuk UI.
 *
 * Dua sumber masuk ke sini: respons AI yang baru dibuat dan baris lama dari
 * database. Keduanya divalidasi ulang dengan skema yang sama, jadi bentuk
 * rusak (baris lama, jawaban model yang setengah) tidak pernah sampai ke
 * layar sebagai angka atau teks kosong.
 *
 * Skor total dihitung di sini, bukan diambil dari model. Dengan begitu angka
 * besar di cincin selalu sama dengan rincian per bagian di bawahnya.
 */

export type LinkedInSectionKey = (typeof LINKEDIN_SECTION_KEYS)[number];

/** Bobot mengikuti kerangka rubrik LinkedIn, disesuaikan untuk konteks
 *  resume: bagian yang bisa dibuktikan dari resume mendapat porsi terbesar.
 *  Jumlahnya 100. */
export const LINKEDIN_SECTION_WEIGHTS: Record<LinkedInSectionKey, number> = {
  headline: 25,
  about: 20,
  experience_descriptions: 25,
  experience_titles: 15,
  skills: 10,
  education: 5,
};

export type LinkedInGrade = "A" | "B" | "C" | "D" | "F";

export interface LinkedInSectionScore {
  key: LinkedInSectionKey;
  /** Skala 0–10. */
  score: number;
  weight: number;
  issues: string[];
  suggestion: string;
}

export interface LinkedInExperienceRewrite {
  company: string;
  title: string;
  period: string;
  bullets: string[];
}

export interface LinkedInResult {
  /** Skor 0–100 hasil rata-rata berbobot. */
  overallScore: number;
  grade: LinkedInGrade;
  verdict: string;
  sections: LinkedInSectionScore[];
  headline: { text: string; why: string };
  about: { text: string; why: string };
  experience: LinkedInExperienceRewrite[];
  skills: { text: string; note: string };
}

/** Ambang grade mengikuti rubrik referensi. */
export function gradeFor(score: number): LinkedInGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

function clean(text: string): string {
  return typeof text === "string" ? text.trim() : "";
}

/**
 * Skor total dari bagian yang benar-benar ada.
 *
 * Bagian yang tidak dikirim model tidak dihitung sebagai nol: bobot bagian
 * yang ada dinormalisasi ulang. Bagian yang ada tapi berskor 0 tetap
 * menurunkan nilai — itu penilaian, bukan data yang hilang.
 */
export function computeOverallScore(
  sections: Array<{ key: LinkedInSectionKey; score: number }>,
): number {
  if (sections.length === 0) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const section of sections) {
    const weight = LINKEDIN_SECTION_WEIGHTS[section.key];
    weighted += section.score * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weighted / totalWeight) * 10);
}

/** Urutan tampilan tetap, tidak mengikuti urutan yang dikirim model. */
const SECTION_ORDER: LinkedInSectionKey[] = [...LINKEDIN_SECTION_KEYS];

/**
 * Validasi + normalisasi keluaran mentah menjadi bentuk yang aman dirender.
 * Mengembalikan null kalau tidak ada satu pun bagian yang bisa dinilai —
 * hasil kosong lebih jujur daripada kartu dengan skor 0 semua.
 */
export function buildLinkedInResult(raw: unknown): LinkedInResult | null {
  const parsed = LinkedInOptimizerResultSchema.safeParse(raw);
  if (!parsed.success) return null;

  // Satu kunci boleh muncul lebih dari sekali (model kadang mengulang);
  // yang dipakai kemunculan pertama supaya bobot tidak dihitung dua kali.
  const byKey = new Map<LinkedInSectionKey, { score: number; issues: string[]; suggestion: string }>();
  for (const section of parsed.data.sections) {
    if (byKey.has(section.key)) continue;
    byKey.set(section.key, {
      score: Math.max(0, Math.min(10, section.score)),
      issues: section.issues.map(clean).filter(Boolean).slice(0, 4),
      suggestion: clean(section.suggestion),
    });
  }

  const sections: LinkedInSectionScore[] = SECTION_ORDER.filter((key) => byKey.has(key)).map(
    (key) => {
      const value = byKey.get(key)!;
      return {
        key,
        score: value.score,
        weight: LINKEDIN_SECTION_WEIGHTS[key],
        issues: value.issues,
        suggestion: value.suggestion,
      };
    },
  );

  if (sections.length === 0) return null;

  const experience = parsed.data.experience
    .map((item) => ({
      company: clean(item.company),
      title: clean(item.title),
      period: clean(item.period),
      bullets: item.bullets.map(clean).filter(Boolean),
    }))
    // Tanpa perusahaan atau tanpa bullet, kartu pengalaman tidak punya isi
    // yang bisa ditempel; lebih baik tidak ditampilkan.
    .filter((item) => item.company && item.bullets.length > 0);

  const overallScore = computeOverallScore(sections);

  return {
    overallScore,
    grade: gradeFor(overallScore),
    verdict: clean(parsed.data.verdict),
    sections,
    headline: { text: clean(parsed.data.headline.text), why: clean(parsed.data.headline.why) },
    about: { text: clean(parsed.data.about.text), why: clean(parsed.data.about.why) },
    experience,
    skills: { text: clean(parsed.data.skills.text), note: clean(parsed.data.skills.note) },
  };
}
