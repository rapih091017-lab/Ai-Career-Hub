import { z } from "zod";
import type { CvData } from "@/components/cv-templates";
import { aiTextForField } from "@/lib/bullet-lines";
import { newId } from "@/lib/id";

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

// Penanda bullet di awal potongan asli diabaikan saat mencocokkan.
const LEADING_MARK = /^\s*(?:[•▪►●◦‣·*–—+-]\s*)+/;

/**
 * Cari potongan `original` di `text` dengan toleransi: penanda bullet di awal
 * dan perbedaan spasi/baris baru diabaikan. Mengembalikan rentang yang cocok.
 */
export function findTolerant(text: string, original: string): { start: number; end: number } | null {
  const core = original.replace(LEADING_MARK, "").trim();
  if (!core) return null;
  const exact = text.indexOf(core);
  if (exact >= 0) return { start: exact, end: exact + core.length };
  const pattern = core
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const m = new RegExp(pattern).exec(text);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

function replaceAt(text: string, r: { start: number; end: number }, replacement: string): string {
  return text.slice(0, r.start) + replacement + text.slice(r.end);
}

export interface AutoFixReport {
  cv: CvData;
  applied: number;
  /** Saran yang potongan aslinya tidak ditemukan lagi di CV. */
  skipped: AutoFixSuggestion[];
}

/**
 * Terapkan saran yang disetujui ke CV. Fungsi murni: mengembalikan CV baru.
 * Saran `replace_text` dilewati (dan dilaporkan) jika potongan asli tidak
 * ditemukan, supaya teks user tidak rusak. Hanya teks pengganti yang
 * dirapikan; bagian deskripsi lain tidak disentuh.
 */
export function applyApprovedFixesWithReport(cv: CvData, fixes: AutoFixSuggestion[]): AutoFixReport {
  let next: CvData = { ...cv, workHistory: cv.workHistory.map((w) => ({ ...w })), skills: [...cv.skills] };
  const skipped: AutoFixSuggestion[] = [];
  let applied = 0;

  for (const fix of fixes) {
    if (fix.type === "replace_text") {
      if (fix.target === "summary") {
        const r = findTolerant(next.summary, fix.original);
        if (!r) { skipped.push(fix); continue; }
        next = { ...next, summary: replaceAt(next.summary, r, fix.replacement.replace(/\s*\n\s*/g, " ").trim()) };
        applied++;
      } else {
        const work = next.workHistory[fix.index ?? -1];
        const r = work ? findTolerant(work.description, fix.original) : null;
        if (!work || !r) { skipped.push(fix); continue; }
        // Pengganti bisa berisi beberapa poin/bernomor: jadi satu poin per baris.
        work.description = replaceAt(work.description, r, aiTextForField(fix.replacement, work.descriptionType));
        applied++;
      }
    } else {
      const exists = next.skills.some((s) => s.name.toLowerCase() === fix.name.toLowerCase());
      if (!exists) {
        next.skills.push({
          id: newId("sk"),
          name: fix.name,
          // Level tidak diketahui dari saran AI; dibiarkan kosong (tidak dirender).
          level: "",
        });
      }
      applied++;
    }
  }
  return { cv: next, applied, skipped };
}

/** Versi lama: hanya CV hasil. */
export function applyApprovedFixes(cv: CvData, fixes: AutoFixSuggestion[]): CvData {
  return applyApprovedFixesWithReport(cv, fixes).cv;
}
