import type { AnalysisResult } from "@/components/checker/types";

export interface HrFinding {
  text: string;
  severity: "critical" | "high" | "medium" | "low" | null;
  /** Kalimat asli dari CV. null berarti tidak ada kutipan, bukan berarti kosong. */
  quote: string | null;
}

export interface HrPointOfView {
  seniority: "entry" | "mid" | "senior" | "lead" | null;
  stopping: HrFinding[];
  continuing: HrFinding[];
  progression: "Strong Upward" | "Upward" | "Stable" | "Sideways" | "Declining" | null;
  growthRate: "Fast" | "Normal" | "Slow" | null;
  /** True saat tidak ada temuan sama sekali; pemanggil wajib menampilkan status jujur. */
  isEmpty: boolean;
}

type Severity = NonNullable<HrFinding["severity"]>;
type Seniority = NonNullable<HrPointOfView["seniority"]>;
type Progression = NonNullable<HrPointOfView["progression"]>;
type GrowthRate = NonNullable<HrPointOfView["growthRate"]>;

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const SENIORITIES: Seniority[] = ["entry", "mid", "senior", "lead"];
const PROGRESSIONS: Progression[] = ["Strong Upward", "Upward", "Stable", "Sideways", "Declining"];
const GROWTH_RATES: GrowthRate[] = ["Fast", "Normal", "Slow"];

/** Buang spasi excess. String kosong berarti tidak ada isi, bukan isi kosong. */
function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Terima nilai yang Persis ada di daftar; yang lain jadi null. */
function oneOf<T extends string>(value: unknown, allowed: T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/**
 * Ubah butir narrative_feedback jadi temuan panel.
 *
 * narrative_feedback berbentuk string polos: tidak ada severity dan tidak ada
 * kutipan, jadi keduanya null — panel tetap bisa merender tanpa berpura-pura
 * ada bukti verbatim yang memang tidak dikirim model.
 */
function fromNarrative(list: unknown): HrFinding[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item): HrFinding | null => {
      const text = clean(item);
      return text ? { text, severity: null, quote: null } : null;
    })
    .filter((item): item is HrFinding => item !== null);
}

/**
 * Rakit pandangan sisi HR dari data yang sudah dikembalikan AI.
 *
 * Tidak memanggil AI dan tidak menyentuh jaringan: ini hanya menata data yang
 * sudah ada supaya komponen tidak perlu bercabang pada berbagai bentuk data.
 * `risk_factors` dan `strengths` datang dalam dua bentuk — string biasa atau
 * objek dengan source_excerpt — dan keduanya dinormalisasi di sini.
 *
 * narrative_feedback bukan duplikat ats_prediction: prompt bahkan punya contoh
 * yang menulis kelemahan hanya ke areas_for_improvement. Karena itu daftar
 * narrative dipakai sebagai cadangan tiap sisi yang kosong di ats_prediction —
 * bukan digabung — supaya kutipan asli tetap menang saat tersedia dan tidak
 * muncul duplikat.
 *
 * Ketat pada data: kolom jsonb diteruskan apa adanya tanpa validasi, jadi
 * entri bukan array, nilai enum asing, dan string kosong semuanya dibuang
 * sebagai "tidak ada", bukan diteruskan ke panel untuk dirender apa adanya.
 */
export function buildHrPointOfView(result: AnalysisResult | null | undefined): HrPointOfView {
  const detail = result?.atsPredictionDetail ?? null;
  const meta = result?.meta ?? null;
  const velocity = result?.careerVelocity ?? null;

  const riskFactors = Array.isArray(detail?.risk_factors) ? detail.risk_factors : [];
  const strengths = Array.isArray(detail?.strengths) ? detail.strengths : [];

  const stopping: HrFinding[] = riskFactors
    .map((item): HrFinding | null => {
      // String polos adalah bentuk lama yang sah (IssueOrString), jadi jangan
      // hanya membaca `.text` — kalau begitu baris string hilang diam-diam.
      const isPlain = typeof item === "string";
      const text = clean(isPlain ? item : item?.text);
      if (!text) return null;
      const severity = isPlain ? null : oneOf(item?.severity, SEVERITIES);
      const quote = isPlain ? "" : clean(item?.source_excerpt);
      return { text, severity, quote: quote || null };
    })
    .filter((item): item is HrFinding => item !== null);

  const continuing: HrFinding[] = strengths
    .map((item): HrFinding | null => {
      const text = typeof item === "string" ? clean(item) : clean(item?.text);
      if (!text) return null;
      const quote = typeof item === "string" ? "" : clean(item?.source_excerpt);
      // Strength tidak punya severity: bobotnya selalu netral supaya panel
      // tidak menampilkan badge risiko di sisi yang justru dibaca positif.
      return { text, severity: null, quote: quote || null };
    })
    .filter((item): item is HrFinding => item !== null);

  // Sisi yang kosong di ats_prediction dibaca dari narrative_feedback. Banyak
  // CV hanya punya kelemahan di areas_for_improvement, jadi tanpa cadangan ini
  // datanya tersimpan di database tapi tidak pernah terlihat pengguna.
  const stoppingFinal = stopping.length > 0 ? stopping : fromNarrative(result?.narrativeFeedback?.areas_for_improvement);
  const continuingFinal = continuing.length > 0 ? continuing : fromNarrative(result?.narrativeFeedback?.strengths);

  return {
    seniority: oneOf(meta?.detected_seniority, SENIORITIES),
    stopping: stoppingFinal,
    continuing: continuingFinal,
    progression: oneOf(velocity?.title_progression, PROGRESSIONS),
    growthRate: oneOf(velocity?.growth_rate, GROWTH_RATES),
    // isEmpty dihitung dari hasil akhir: panel yang terisi lewat cadangan
    // bukan panel kosong, dan pemanggil tidak boleh menampilkan status jujur
    // yang menyesatkan.
    isEmpty: stoppingFinal.length === 0 && continuingFinal.length === 0,
  };
}
