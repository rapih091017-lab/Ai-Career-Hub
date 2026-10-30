import { DEFAULT_SECTION_ORDER } from "@/components/cv-templates";
import type { CustomSectionEntry, SectionKey } from "@/components/cv-templates";

/**
 * Baca format builder tersimpan (`cv_fmt_<id>`) dari localStorage.
 * Mengembalikan null bila kosong, rusak, atau storage tidak bisa diakses.
 */
export function readSavedFormat(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Jumlah halaman A4 untuk konten setinggi `heightPx` (96 dpi). Minimal 1. */
export function countPages(heightPx: number, contentAreaMm: number): number {
  const pagePx = contentAreaMm * (96 / 25.4);
  if (!(heightPx > 0) || !(pagePx > 0)) return 1;
  return Math.max(1, Math.ceil(heightPx / pagePx));
}

/* ───────── Migrasi format tersimpan ───────── */

const BUILTIN = new Set<string>(DEFAULT_SECTION_ORDER);

/**
 * Rapikan urutan section tersimpan:
 * - entri bukan string, duplikat, atau bukan section bawaan/custom dibuang;
 * - section bawaan yang hilang dikembalikan tepat setelah section sebelumnya
 *   di urutan bawaan (certifications → setelah skills, selfEvaluation →
 *   setelah summary), jadi CV lama tetap tampil di posisi yang sama.
 * Mengembalikan null bila input bukan array (pakai urutan bawaan).
 */
export function migrateSectionOrder(saved: unknown, customIds: string[]): (SectionKey | string)[] | null {
  if (!Array.isArray(saved)) return null;
  const custom = new Set(customIds);
  const out: string[] = [];
  for (const k of saved) {
    if (typeof k !== "string" || out.includes(k)) continue;
    if (BUILTIN.has(k) || custom.has(k)) out.push(k);
  }
  DEFAULT_SECTION_ORDER.forEach((key, i) => {
    if (out.includes(key)) return;
    // Cari section bawaan sebelumnya yang sudah ada di daftar.
    let pos = 0;
    for (let j = i - 1; j >= 0; j--) {
      const at = out.indexOf(DEFAULT_SECTION_ORDER[j]);
      if (at !== -1) {
        pos = at + 1;
        break;
      }
    }
    out.splice(pos, 0, key);
  });
  return out;
}

/**
 * Hanya nilai boolean yang dipakai. CV lama: sertifikasi dulu bagian dari
 * section Keahlian, jadi kalau Keahlian disembunyikan, sertifikasi ikut
 * disembunyikan agar tampilannya tetap sama.
 */
export function migrateSectionVisibility(saved: unknown): Record<string, boolean> | null {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(saved)) if (typeof v === "boolean") out[k] = v;
  if (out.skills === false && !("certifications" in out)) out.certifications = false;
  return out;
}

export function migrateCustomSections(saved: unknown): CustomSectionEntry[] | null {
  if (!Array.isArray(saved)) return null;
  const out: CustomSectionEntry[] = [];
  for (const c of saved) {
    if (!c || typeof c !== "object" || typeof c.id !== "string" || !c.id) continue;
    if (out.some((x) => x.id === c.id)) continue;
    out.push({
      ...c,
      id: c.id,
      title: typeof c.title === "string" ? c.title : "",
      content: typeof c.content === "string" ? c.content : "",
      contentType: c.contentType === "paragraph" ? "paragraph" : "bullets",
    });
  }
  return out;
}

export interface SavedFormat {
  fontFamily?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  showDividers?: boolean;
  sectionOrder?: (SectionKey | string)[];
  customPrimaryColor?: string;
  spacingMode?: "compact" | "normal" | "spacious";
  headerLayout?: "centered" | "left";
  sectionVisibility?: Record<string, boolean>;
  customSections?: CustomSectionEntry[];
  marginMode?: "tight" | "normal" | "wide";
  showSkillLevel?: boolean;
}

const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | undefined =>
  (list as readonly unknown[]).includes(v) ? (v as T) : undefined;

/** Ubah objek mentah dari localStorage menjadi format valid; nilai invalid dibuang. */
export function migrateSavedFormat(raw: Record<string, unknown> | null): SavedFormat {
  if (!raw) return {};
  const out: SavedFormat = {};
  if (typeof raw.fontFamily === "string" && raw.fontFamily) out.fontFamily = raw.fontFamily;
  if (typeof raw.fontSize === "number" && raw.fontSize >= 6 && raw.fontSize <= 30) out.fontSize = raw.fontSize;
  out.textAlign = oneOf(raw.textAlign, ["left", "center", "right", "justify"] as const);
  if (typeof raw.showDividers === "boolean") out.showDividers = raw.showDividers;
  if (typeof raw.customPrimaryColor === "string") out.customPrimaryColor = raw.customPrimaryColor;
  out.spacingMode = oneOf(raw.spacingMode, ["compact", "normal", "spacious"] as const);
  out.headerLayout = oneOf(raw.headerLayout, ["centered", "left"] as const);
  out.marginMode = oneOf(raw.marginMode, ["tight", "normal", "wide"] as const);
  if (typeof raw.showSkillLevel === "boolean") out.showSkillLevel = raw.showSkillLevel;

  const customSections = migrateCustomSections(raw.customSections);
  if (customSections) out.customSections = customSections;
  const customIds = (customSections ?? [{ id: "lainnya" }]).map((c) => c.id);
  const order = migrateSectionOrder(raw.sectionOrder, customIds);
  if (order && Array.isArray(raw.sectionOrder) && raw.sectionOrder.length > 0) out.sectionOrder = order;
  const vis = migrateSectionVisibility(raw.sectionVisibility);
  if (vis) out.sectionVisibility = vis;

  for (const k of Object.keys(out) as (keyof SavedFormat)[]) if (out[k] === undefined) delete out[k];
  return out;
}
