import { z } from "zod";
import type { CvData } from "@/components/cv-templates";

/**
 * Saran perbaikan dari AI. Tiap saran hanya boleh mengubah teks yang
 * sudah ada di CV. Saran yang tidak valid dibuang, bukan diganti default.
 *
 * - replace_text: ganti `original` (potongan persis) dengan `replacement`
 *   di ringkasan atau di deskripsi pengalaman ke-`index`.
 * - add_skill: tambahkan `name` ke daftar keahlian (keyword dari JD yang
 *   memang relevan dengan pengalaman user).
 */
export const AutoFixSuggestionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("replace_text"),
    target: z.enum(["summary", "experience"]),
    index: z.number().int().min(0).optional(),
    original: z.string().min(1),
    replacement: z.string().min(1),
    category: z.enum(["bahasa", "bullet", "kata_kunci"]),
    reason: z.string().catch(""),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("add_skill"),
    name: z.string().min(1).max(60),
    category: z.literal("kata_kunci"),
    reason: z.string().catch(""),
  }),
]);

export type AutoFixSuggestion = z.infer<typeof AutoFixSuggestionSchema>;

export const AutoFixResponseSchema = z.object({
  suggestions: z.array(z.unknown()).catch([]),
});

/** Ambil saran yang valid saja dari respons AI. */
export function parseAutoFixSuggestions(raw: unknown): AutoFixSuggestion[] {
  const parsed = AutoFixResponseSchema.safeParse(raw);
  if (!parsed.success) return [];
  const out: AutoFixSuggestion[] = [];
  for (const item of parsed.data.suggestions) {
    const r = AutoFixSuggestionSchema.safeParse(item);
    if (r.success) out.push(r.data);
  }
  return out;
}

/** Teks polos CV untuk dikirim ke checker. */
export function cvToPlainText(cv: CvData): string {
  const lines: string[] = [];
  if (cv.fullName) lines.push(cv.fullName);
  if (cv.professionalTitle) lines.push(cv.professionalTitle);
  if (cv.summary) lines.push("", "Ringkasan", cv.summary);
  if (cv.workHistory.length) {
    lines.push("", "Pengalaman");
    for (const w of cv.workHistory) {
      lines.push(`${w.position} - ${w.company}`.trim());
      if (w.description) lines.push(w.description);
    }
  }
  if (cv.education.length) {
    lines.push("", "Pendidikan");
    for (const e of cv.education) {
      lines.push([e.degree, e.field, e.institution].filter(Boolean).join(" - "));
    }
  }
  if (cv.skills.length) {
    lines.push("", "Keahlian", cv.skills.map((s) => s.name).join(", "));
  }
  return lines.join("\n");
}

/**
 * Terapkan saran yang disetujui ke CV. Fungsi murni: mengembalikan CV baru.
 * Saran `replace_text` dilewati jika potongan asli tidak ditemukan persis,
 * supaya teks user tidak rusak.
 */
export function applyApprovedFixes(cv: CvData, fixes: AutoFixSuggestion[]): CvData {
  let next: CvData = { ...cv, workHistory: cv.workHistory.map((w) => ({ ...w })), skills: [...cv.skills] };

  for (const fix of fixes) {
    if (fix.type === "replace_text") {
      if (fix.target === "summary") {
        if (next.summary.includes(fix.original)) {
          next = { ...next, summary: next.summary.replace(fix.original, () => fix.replacement) };
        }
      } else {
        const work = next.workHistory[fix.index ?? -1];
        if (work && work.description.includes(fix.original)) {
          work.description = work.description.replace(fix.original, () => fix.replacement);
        }
      }
    } else {
      const exists = next.skills.some((s) => s.name.toLowerCase() === fix.name.toLowerCase());
      if (!exists) {
        next.skills.push({
          id: `auto-${next.skills.length}-${fix.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: fix.name,
          level: "intermediate",
        });
      }
    }
  }
  return next;
}
