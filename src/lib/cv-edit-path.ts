import type { CvData } from "@/components/cv-templates";
import { STEP, stepForSection } from "@/lib/builder-steps";

/**
 * Path teks CV di pratinjau (atribut `data-cv-path`), mis. "fullName",
 * "workHistory.<id>.company", "workHistory.<id>.description.2",
 * "sectionLabels.experience". Dipakai untuk edit langsung di pratinjau dan
 * untuk lompat ke field form yang sesuai.
 */

const TOP_TEXT = ["fullName", "professionalTitle", "email", "phone", "address", "linkedin", "portfolioUrl", "summary", "selfEvaluation"] as const;
const LIST_TEXT: Record<string, readonly string[]> = {
  workHistory: ["position", "company", "location"],
  education: ["institution", "degree", "field"],
  organisations: ["name", "position"],
};

/** Path yang boleh diedit langsung di pratinjau (field satu baris & ringkasan). */
export function isInlineEditablePath(path: string): boolean {
  const [head, id, field, ...rest] = path.split(".");
  if (rest.length) return false;
  if ((TOP_TEXT as readonly string[]).includes(head)) return id === undefined;
  if (head === "sectionLabels") return !!id && field === undefined;
  if (head === "customSections") return !!id && field === "title";
  return !!LIST_TEXT[head] && !!id && LIST_TEXT[head].includes(field);
}

/** Daftar yang deskripsinya bisa berupa poin (path "<daftar>.<id>.description.<n>"). */
const BULLET_LISTS = ["workHistory", "organisations"] as const;
/** Field tanggal (nilai "YYYY-MM" atau kosong) per daftar. */
const DATE_FIELDS: Record<string, readonly string[]> = {
  workHistory: ["startDate", "endDate"],
  education: ["startDate", "endDate"],
  organisations: ["startDate", "endDate"],
};
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Path satu poin deskripsi; n = indeks baris mentah (termasuk baris kosong). */
export function isBulletPath(path: string): boolean {
  const [head, id, field, index, ...rest] = path.split(".");
  return !rest.length && (BULLET_LISTS as readonly string[]).includes(head) && !!id && field === "description" && /^\d+$/.test(index ?? "");
}

/** Path seluruh deskripsi poin sebuah entri (untuk riwayat undo pecah/hapus poin). */
export function isDescriptionPath(path: string): boolean {
  const [head, id, field, ...rest] = path.split(".");
  return !rest.length && (BULLET_LISTS as readonly string[]).includes(head) && !!id && field === "description";
}

/** Path tanggal mulai/selesai sebuah entri. */
export function isDatePath(path: string): boolean {
  const [head, id, field, ...rest] = path.split(".");
  return !rest.length && !!id && !!DATE_FIELDS[head]?.includes(field);
}

type Entry = { id: string } & Record<string, unknown>;
function entryOf(cv: CvData, head: string, id: string): Entry | undefined {
  return (cv[head as keyof CvData] as Entry[] | undefined)?.find((e) => e.id === id);
}
function withEntry(cv: CvData, head: string, id: string, patch: Record<string, unknown>): CvData {
  const list = cv[head as keyof CvData] as Entry[];
  return { ...cv, [head]: list.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}
const rawLines = (text: unknown) => String(text ?? "").replace(/\r\n?/g, "\n").split("\n");

/** Baca nilai teks di path; undefined bila path tidak dikenal atau entri tidak ada. */
export function getCvPath(cv: CvData, path: string): string | undefined {
  if (isBulletPath(path) || isDatePath(path) || isDescriptionPath(path)) {
    const [head, id, field, index] = path.split(".");
    const entry = entryOf(cv, head, id);
    if (!entry) return undefined;
    return index === undefined ? String(entry[field] ?? "") : rawLines(entry.description)[Number(index)];
  }
  if (!isInlineEditablePath(path)) return undefined;
  const [head, id, field] = path.split(".");
  if (head === "sectionLabels") return cv.sectionLabels?.[id] ?? "";
  if (head === "customSections") return cv.customSections?.find((c) => c.id === id)?.title;
  if (field) {
    const entry = (cv[head as keyof CvData] as { id: string }[] | undefined)?.find((e) => e.id === id) as Record<string, unknown> | undefined;
    return entry ? String(entry[field] ?? "") : undefined;
  }
  return String(cv[head as keyof CvData] ?? "");
}

/** Tulis nilai teks ke path. Path tak dikenal / entri hilang → data tidak berubah. */
export function setCvPath(cv: CvData, path: string, value: string): CvData {
  if (isBulletPath(path)) {
    const [head, id, , index] = path.split(".");
    const entry = entryOf(cv, head, id);
    const lines = rawLines(entry?.description);
    const i = Number(index);
    if (!entry || i >= lines.length) return cv;
    lines[i] = value.replace(/\r?\n/g, " ");
    return withEntry(cv, head, id, { description: lines.join("\n") });
  }
  if (isDescriptionPath(path)) {
    const [head, id] = path.split(".");
    if (!entryOf(cv, head, id)) return cv;
    return withEntry(cv, head, id, { description: value });
  }
  if (isDatePath(path)) {
    const [head, id, field] = path.split(".");
    // Nilai tidak valid dibuang, bukan diganti default.
    if (!entryOf(cv, head, id) || (value !== "" && !MONTH_RE.test(value))) return cv;
    return withEntry(cv, head, id, { [field]: value });
  }
  if (!isInlineEditablePath(path)) return cv;
  const [head, id, field] = path.split(".");
  if (head === "sectionLabels") {
    const { [id]: _old, ...rest } = cv.sectionLabels ?? {};
    // Label kosong = kembali ke judul bawaan.
    return { ...cv, sectionLabels: value.trim() ? { ...rest, [id]: value } : rest };
  }
  if (head === "customSections") {
    const list = cv.customSections ?? [];
    if (!list.some((c) => c.id === id)) return cv;
    return { ...cv, customSections: list.map((c) => (c.id === id ? { ...c, title: value } : c)) };
  }
  if (field) {
    const list = cv[head as "workHistory" | "education" | "organisations"] as { id: string }[];
    if (!list?.some((e) => e.id === id)) return cv;
    return { ...cv, [head]: list.map((e) => (e.id === id ? { ...e, [field]: value } : e)) };
  }
  return { ...cv, [head]: value };
}

/** Langkah form (indeks stepper) untuk sebuah path atau kunci section. */
export function stepForPath(path: string): number {
  const [head, id] = path.split(".");
  switch (head) {
    case "workHistory":
      return STEP.EXPERIENCE;
    case "education":
      return STEP.EDUCATION;
    case "organisations":
      return STEP.ORGANIZATIONS;
    case "skills":
    case "certifications":
    case "selfEvaluation":
    case "customSections":
      return STEP.SKILLS;
    case "sectionLabels":
      return stepForSection(id ?? "");
    case "jobTitle":
    case "jobDescription":
      return STEP.TARGET;
    default:
      // Field header (nama, kontak, motto) dan ringkasan ada di Data Diri.
      return STEP.PERSONAL;
  }
}

/**
 * Kandidat target di form, dari yang paling spesifik:
 * `[data-cv-field]` di dalam `[data-cv-entry]` (entri daftar) atau di mana saja (field tunggal).
 */
export function formTargetFor(path: string, root: ParentNode = document): HTMLElement | null {
  const parts = path.split(".");
  const [head, id, field, index] = parts;
  const q = (sel: string, from: ParentNode = root) => from.querySelector<HTMLElement>(sel);
  if (LIST_TEXT[head] && id) {
    const entry = q(`[data-cv-entry="${CSS.escape(`${head}.${id}`)}"]`);
    if (!entry) return null;
    if (!field) return entry;
    const box = q(`[data-cv-field="${CSS.escape(field)}"]`, entry);
    if (!box) return entry;
    if (index !== undefined) return q(`textarea[data-index="${CSS.escape(index)}"]`, box) ?? box;
    return box;
  }
  // Path panjang dipotong dari belakang sampai ada field yang cocok.
  for (let n = parts.length; n > 0; n--) {
    const hit = q(`[data-cv-field="${CSS.escape(parts.slice(0, n).join("."))}"]`);
    if (hit) return hit;
  }
  return null;
}

/** Elemen yang bisa difokus di dalam target (target itu sendiri bila input). */
export function focusableIn(el: HTMLElement): HTMLElement | null {
  if (el.matches("input, textarea, select, [contenteditable]")) return el;
  return el.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select, [contenteditable]");
}

/**
 * Enter di poin pratinjau: sisipkan poin baru berisi `after` tepat setelah
 * poin di path. Mengembalikan path poin baru untuk difokus.
 */
export function splitBullet(cv: CvData, path: string, after: string): { cv: CvData; focusPath: string } | null {
  if (!isBulletPath(path)) return null;
  const [head, id, , index] = path.split(".");
  const entry = entryOf(cv, head, id);
  const lines = rawLines(entry?.description);
  const i = Number(index);
  if (!entry || i >= lines.length) return null;
  lines.splice(i + 1, 0, after.replace(/\r?\n/g, " "));
  return { cv: withEntry(cv, head, id, { description: lines.join("\n") }), focusPath: `${head}.${id}.description.${i + 1}` };
}

/**
 * Backspace di poin kosong: hapus poin itu. Fokus pindah ke poin sebelumnya
 * (null bila yang dihapus poin pertama).
 */
export function removeBullet(cv: CvData, path: string): { cv: CvData; focusPath: string | null } | null {
  if (!isBulletPath(path)) return null;
  const [head, id, , index] = path.split(".");
  const entry = entryOf(cv, head, id);
  const lines = rawLines(entry?.description);
  const i = Number(index);
  if (!entry || i >= lines.length || lines[i].trim() !== "") return null;
  lines.splice(i, 1);
  return {
    cv: withEntry(cv, head, id, { description: lines.join("\n") }),
    focusPath: i > 0 ? `${head}.${id}.description.${i - 1}` : null,
  };
}

/** Path deskripsi penuh dari path poin ("a.b.description.2" → "a.b.description"). */
export const descriptionPathOf = (bulletPath: string) => bulletPath.split(".").slice(0, 3).join(".");
