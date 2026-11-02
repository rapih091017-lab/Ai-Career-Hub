import type { CvData } from "@/components/cv-templates";

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

/** Baca nilai teks di path; undefined bila path tidak dikenal atau entri tidak ada. */
export function getCvPath(cv: CvData, path: string): string | undefined {
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

const SECTION_STEP: Record<string, number> = {
  header: 0,
  summary: 0,
  experience: 2,
  education: 3,
  organizations: 4,
  skills: 5,
  certifications: 5,
  selfEvaluation: 5,
};

/** Langkah form (indeks stepper) untuk sebuah path atau kunci section. */
export function stepForPath(path: string): number {
  const [head, id] = path.split(".");
  switch (head) {
    case "workHistory":
      return 2;
    case "education":
      return 3;
    case "organisations":
      return 4;
    case "skills":
    case "certifications":
    case "selfEvaluation":
    case "customSections":
      return 5;
    case "sectionLabels":
      return SECTION_STEP[id] ?? 5;
    default:
      return SECTION_STEP[head] ?? 0;
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
