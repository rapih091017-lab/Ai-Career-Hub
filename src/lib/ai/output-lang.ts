import { z } from "zod";

/**
 * Bahasa hasil AI yang dipilih user ("Bahasa hasil: Indonesia | English").
 *
 * Keputusan: teks yang ditempel ke CV (hasil poles, bullet, versi revisi,
 * replacement, copy_text) mengikuti outputLang. Penjelasan/tip untuk user
 * ikut outputLang juga supaya satu respons tidak bercampur bahasa; label UI
 * di sekitarnya tetap bahasa UI.
 */
export type OutputLang = "id" | "en";

export const OutputLangSchema = z.enum(["id", "en"]);

/** Kata fungsi umum untuk menebak bahasa teks pendek. */
const ID_WORDS = new Set([
  "dan", "yang", "di", "untuk", "dengan", "dari", "ke", "pada", "dalam", "sebagai",
  "tim", "membantu", "mengelola", "meningkatkan", "melakukan", "serta", "atau", "ini", "itu", "secara",
]);
const EN_WORDS = new Set([
  "and", "the", "of", "to", "for", "with", "in", "on", "as", "by",
  "team", "managed", "led", "developed", "improved", "responsible", "or", "this", "that", "from",
]);

/** Tebakan bahasa dari teks; null bila tidak cukup petunjuk. */
export function detectLang(text: string | null | undefined): OutputLang | null {
  if (!text) return null;
  let id = 0;
  let en = 0;
  for (const w of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (ID_WORDS.has(w)) id++;
    if (EN_WORDS.has(w)) en++;
  }
  if (id === en) return null;
  return id > en ? "id" : "en";
}

/** Urutan: pilihan eksplisit → bahasa CV → deteksi teks input → "id". */
export function resolveOutputLang(opts: {
  requested?: unknown;
  cvLang?: unknown;
  text?: string | null;
}): OutputLang {
  const req = OutputLangSchema.safeParse(opts.requested);
  if (req.success) return req.data;
  const cv = OutputLangSchema.safeParse(opts.cvLang);
  if (cv.success) return cv.data;
  return detectLang(opts.text) ?? "id";
}

export const OUTPUT_LANG_NAME: Record<OutputLang, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

/** Instruksi bahasa yang ditambahkan di akhir system prompt (paling akhir = paling dipatuhi). */
export function outputLangInstruction(lang: OutputLang): string {
  const name = OUTPUT_LANG_NAME[lang];
  const placeholders = lang === "en" ? "[number], [percent], [team size]" : "[angka], [persen], [jumlah orang]";
  return `
--- BAHASA OUTPUT (WAJIB, MENGALAHKAN ATURAN BAHASA LAIN) ---
Tulis seluruh output dalam ${name}; jangan campur bahasa.
Jika teks input berbahasa lain, terjemahkan isinya ke ${name} tanpa menambah fakta.
Terjemahkan istilah umum, kecuali nama tool, teknologi, dan perusahaan.
Placeholder memakai bahasa yang sama: ${placeholders}.
Nama field/kunci JSON tetap seperti skema.
`;
}

/** Tambahkan instruksi bahasa ke system prompt. */
export function withOutputLang(systemPrompt: string, lang: OutputLang): string {
  return `${systemPrompt}\n${outputLangInstruction(lang)}`;
}

/**
 * Validasi field outputLang dari body yang tidak memakai skema zod penuh.
 * undefined/null = tidak dipilih; nilai lain di luar enum = ditolak.
 */
export function parseOutputLangField(value: unknown): { ok: true; lang?: OutputLang } | { ok: false } {
  if (value === undefined || value === null) return { ok: true };
  const r = OutputLangSchema.safeParse(value);
  return r.success ? { ok: true, lang: r.data } : { ok: false };
}

/**
 * Checker: penjelasan mengikuti bahasa UI ({{OUTPUT_LANGUAGE}}), tapi teks
 * yang bisa ditempel ke CV mengikuti pilihan user. Tanpa pilihan, prompt
 * tidak diubah sama sekali (aturan lama: copy_text sebahasa dengan CV).
 */
export function checkerCopyLangInstruction(lang: OutputLang): string {
  const name = OUTPUT_LANG_NAME[lang];
  const placeholders = lang === "en" ? "[number], [percent], [team size]" : "[angka], [persen], [jumlah orang]";
  return `
--- BAHASA TEKS TEMPEL (PILIHAN USER, MENGALAHKAN ATURAN #3 TEKS TEMPEL) ---
Semua teks yang bisa ditempel ke CV (copy_text, rewrite_copy_text, grouped_skills_copy_text,
template_copy_text, fix.copy_text, suggested_rewrite) ditulis seluruhnya dalam ${name}; jangan campur bahasa.
Terjemahkan isinya tanpa menambah fakta; nama tool, teknologi, dan perusahaan tetap.
Placeholder memakai bahasa yang sama: ${placeholders}.
Field lain (penjelasan, label, alasan) tetap mengikuti BAHASA output di atas.
Kutipan bukti (evidence, source_excerpt, replaces) tetap potongan persis dari CV, tidak diterjemahkan.
`;
}
