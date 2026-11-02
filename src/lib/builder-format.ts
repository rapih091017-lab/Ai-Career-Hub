import { DEFAULT_SECTION_ORDER } from "@/components/cv-templates";
import type { CustomSectionEntry, CvData, CvLayout, SectionKey } from "@/components/cv-templates";

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

/** Batas jumlah section kustom (termasuk "Lainnya"). */
export const MAX_CUSTOM_SECTIONS = 10;

export function migrateCustomSections(saved: unknown): CustomSectionEntry[] | null {
  if (!Array.isArray(saved)) return null;
  const out: CustomSectionEntry[] = [];
  for (const c of saved) {
    if (out.length >= MAX_CUSTOM_SECTIONS) break;
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

/* ───────── Layout di server (CvData.layout) ───────── */

/**
 * Nilai yang dulu selalu dipakai builder sebelum layout tersimpan di server.
 * CV tanpa `layout` dirender dengan nilai ini supaya tampilannya tidak
 * berubah; layout baru juga diawali dari nilai ini.
 */
export const LEGACY_LAYOUT: CvLayout = {
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  textAlign: "left",
  showDividers: false,
  spacingMode: "normal",
  headerLayout: "centered",
  marginMode: "normal",
  showSkillLevel: false,
};

/** Section custom bawaan builder; ada sejak awal dengan isi kosong. */
export const DEFAULT_CUSTOM_SECTIONS: CustomSectionEntry[] = [
  { id: "lainnya", title: "Lainnya", content: "", contentType: "bullets" },
];

/** Section wajib: tidak bisa dihapus, hanya disembunyikan. */
export const REQUIRED_SECTIONS: readonly SectionKey[] = ["summary", "experience", "education", "skills"];

/** Section bawaan yang boleh dihapus dari CV (datanya dikosongkan). */
export const OPTIONAL_SECTIONS: readonly SectionKey[] = ["selfEvaluation", "certifications", "organizations"];

/** Apakah section bawaan punya isi yang akan dirender. */
export function sectionHasContent(data: Pick<CvData, "summary" | "selfEvaluation" | "workHistory" | "education" | "skills" | "certifications" | "organisations">, key: SectionKey): boolean {
  switch (key) {
    case "summary":
      return !!data.summary?.trim();
    case "selfEvaluation":
      return !!data.selfEvaluation?.trim();
    case "experience":
      return (data.workHistory?.length ?? 0) > 0;
    case "education":
      return (data.education?.length ?? 0) > 0;
    case "skills":
      return (data.skills?.length ?? 0) > 0;
    case "certifications":
      return (data.certifications?.length ?? 0) > 0;
    case "organizations":
      return (data.organisations?.length ?? 0) > 0;
  }
}

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const KEY_MAX = 100;

const boolRecord = (v: unknown): Record<string, boolean> | undefined => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const out: Record<string, boolean> = {};
  for (const [k, b] of Object.entries(v)) if (typeof b === "boolean" && k.length <= KEY_MAX) out[k] = b;
  return out;
};

/**
 * Rapikan `layout` dari DB. Nilai invalid dibuang (bukan diganti default).
 * Urutan section: id tak dikenal & duplikat dibuang; section bawaan yang
 * hilang dikembalikan di posisi bawaannya bila wajib atau punya isi
 * (section opsional yang sengaja dihapus kosong, jadi tidak muncul lagi);
 * section kustom berisi yang hilang ditambahkan di akhir.
 */
export function sanitizeLayout(
  raw: unknown,
  ctx: { customSections: CustomSectionEntry[]; hasContent: (key: SectionKey) => boolean },
): CvLayout {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const out: CvLayout = {};
  if (typeof r.fontFamily === "string" && r.fontFamily && r.fontFamily.length <= 200) out.fontFamily = r.fontFamily;
  if (typeof r.fontSize === "number" && r.fontSize >= 6 && r.fontSize <= 30) out.fontSize = r.fontSize;
  const textAlign = oneOf(r.textAlign, ["left", "center", "right", "justify"] as const);
  if (textAlign) out.textAlign = textAlign;
  if (typeof r.showDividers === "boolean") out.showDividers = r.showDividers;
  if (typeof r.primaryColor === "string" && HEX_COLOR.test(r.primaryColor)) out.primaryColor = r.primaryColor;
  const spacingMode = oneOf(r.spacingMode, ["compact", "normal", "spacious"] as const);
  if (spacingMode) out.spacingMode = spacingMode;
  const headerLayout = oneOf(r.headerLayout, ["centered", "left"] as const);
  if (headerLayout) out.headerLayout = headerLayout;
  const marginMode = oneOf(r.marginMode, ["tight", "normal", "wide"] as const);
  if (marginMode) out.marginMode = marginMode;
  if (typeof r.showSkillLevel === "boolean") out.showSkillLevel = r.showSkillLevel;
  const vis = migrateSectionVisibility(r.sectionVisibility);
  if (vis) out.sectionVisibility = vis;
  const dividers = boolRecord(r.dividers);
  if (dividers) out.dividers = dividers;

  const removed = Array.isArray(r.removedSections)
    ? [...new Set(r.removedSections.filter((k): k is string => typeof k === "string" && k.length <= KEY_MAX))]
    : undefined;
  if (removed) out.removedSections = removed;
  const isRemoved = (k: string) => !!removed?.includes(k);

  if (Array.isArray(r.sectionOrder)) {
    const customIds = new Set(ctx.customSections.map((c) => c.id));
    const order: string[] = [];
    for (const k of r.sectionOrder) {
      if (typeof k !== "string" || order.includes(k) || isRemoved(k)) continue;
      if (BUILTIN.has(k) || customIds.has(k)) order.push(k);
    }
    DEFAULT_SECTION_ORDER.forEach((key, i) => {
      if (order.includes(key) || isRemoved(key)) return;
      if (!REQUIRED_SECTIONS.includes(key) && !ctx.hasContent(key)) return;
      let pos = 0;
      for (let j = i - 1; j >= 0; j--) {
        const at = order.indexOf(DEFAULT_SECTION_ORDER[j]);
        if (at !== -1) {
          pos = at + 1;
          break;
        }
      }
      order.splice(pos, 0, key);
    });
    for (const c of ctx.customSections) {
      if (!order.includes(c.id) && !isRemoved(c.id) && c.content.trim()) order.push(c.id);
    }
    out.sectionOrder = order;
  }
  return out;
}

/** Format localStorage lama → layout server (dipakai sekali saat migrasi). */
export function layoutFromSavedFormat(saved: SavedFormat): CvLayout {
  const out: CvLayout = { ...LEGACY_LAYOUT };
  if (saved.fontFamily) out.fontFamily = saved.fontFamily;
  if (saved.fontSize) out.fontSize = saved.fontSize;
  if (saved.textAlign) out.textAlign = saved.textAlign;
  if (saved.showDividers !== undefined) out.showDividers = saved.showDividers;
  if (saved.customPrimaryColor && HEX_COLOR.test(saved.customPrimaryColor)) out.primaryColor = saved.customPrimaryColor;
  if (saved.spacingMode) out.spacingMode = saved.spacingMode;
  if (saved.headerLayout) out.headerLayout = saved.headerLayout;
  if (saved.marginMode) out.marginMode = saved.marginMode;
  if (saved.sectionOrder) out.sectionOrder = saved.sectionOrder;
  if (saved.sectionVisibility) out.sectionVisibility = saved.sectionVisibility;
  if (saved.showSkillLevel !== undefined) out.showSkillLevel = saved.showSkillLevel;
  return out;
}
