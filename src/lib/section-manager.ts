import { DEFAULT_SECTION_ORDER, type CustomSectionEntry, type CvData, type SectionKey } from "@/components/cv-templates";
import { DEFAULT_CUSTOM_SECTIONS, LEGACY_LAYOUT, MAX_CUSTOM_SECTIONS, OPTIONAL_SECTIONS } from "@/lib/builder-format";
import { newId } from "@/lib/id";

/**
 * Kelola section CV (hapus section opsional, urungkan, pakai lagi, tambah
 * section kustom). Fungsi murni atas CvData; urutan & garis ada di
 * cvData.layout sehingga ikut tersimpan.
 */

export const LAINNYA_ID = "lainnya";

/** Judul cepat untuk section kustom baru. */
export const QUICK_CUSTOM_TITLES = ["Penghargaan", "Proyek", "Publikasi", "Bahasa", "Kegiatan Sukarela", "Pelatihan"] as const;

export const BUILTIN_LABELS: Record<string, string> = {
  summary: "Ringkasan Profesional",
  selfEvaluation: "Evaluasi Diri",
  experience: "Pengalaman Kerja",
  education: "Pendidikan",
  skills: "Keahlian",
  certifications: "Sertifikasi",
  organizations: "Organisasi",
  lainnya: "Lainnya",
};

export const orderOf = (cv: CvData): string[] => cv.layout?.sectionOrder ?? [...DEFAULT_SECTION_ORDER, LAINNYA_ID];
export const customSectionsOf = (cv: CvData): CustomSectionEntry[] => cv.customSections ?? DEFAULT_CUSTOM_SECTIONS;

const isBuiltin = (key: string): key is SectionKey => (DEFAULT_SECTION_ORDER as string[]).includes(key);

/** Section yang boleh dihapus: bawaan opsional dan semua section kustom. */
export function isRemovableSection(cv: CvData, key: string): boolean {
  if (isBuiltin(key)) return OPTIONAL_SECTIONS.includes(key);
  return customSectionsOf(cv).some((c) => c.id === key);
}

export function sectionLabel(cv: CvData, key: string): string {
  const custom = customSectionsOf(cv).find((c) => c.id === key);
  if (custom && key !== LAINNYA_ID) return custom.title.trim() || "Bagian tanpa judul";
  return BUILTIN_LABELS[key] ?? key;
}

function withLayout(cv: CvData, patch: { sectionOrder?: string[]; dividers?: Record<string, boolean>; sectionVisibility?: Record<string, boolean> }): CvData {
  const base = cv.layout ?? { ...LEGACY_LAYOUT };
  return { ...cv, layout: { ...base, ...patch } };
}

/** Data yang disimpan untuk Urungkan setelah section dihapus. */
export interface RemovedSection {
  key: string;
  orderIndex: number;
  divider?: boolean;
  /** Isi section bawaan sebelum dikosongkan. */
  data?: Partial<Pick<CvData, "organisations" | "certifications" | "selfEvaluation">>;
  /** Entri section kustom beserta posisinya. */
  custom?: { entry: CustomSectionEntry; index: number };
}

/** Hapus section opsional: data dikosongkan dan keluar dari urutan. */
export function removeSection(cv: CvData, key: string): { cv: CvData; removed: RemovedSection } | null {
  if (!isRemovableSection(cv, key)) return null;
  const order = orderOf(cv);
  const removed: RemovedSection = { key, orderIndex: order.indexOf(key), divider: cv.layout?.dividers?.[key] };
  let next: CvData = { ...cv };
  if (key === "organizations") {
    removed.data = { organisations: cv.organisations };
    next.organisations = [];
  } else if (key === "certifications") {
    removed.data = { certifications: cv.certifications };
    next.certifications = [];
  } else if (key === "selfEvaluation") {
    removed.data = { selfEvaluation: cv.selfEvaluation };
    next.selfEvaluation = "";
  } else {
    const list = customSectionsOf(cv);
    const index = list.findIndex((c) => c.id === key);
    removed.custom = { entry: list[index], index };
    next.customSections = list.filter((c) => c.id !== key);
  }
  const { [key]: _gone, ...dividers } = cv.layout?.dividers ?? {};
  next = withLayout(next, { sectionOrder: order.filter((k) => k !== key), dividers });
  return { cv: next, removed };
}

/** Kembalikan section yang baru dihapus (tombol Urungkan). */
export function undoRemoveSection(cv: CvData, removed: RemovedSection): CvData {
  let next: CvData = { ...cv, ...(removed.data ?? {}) };
  if (removed.custom) {
    const list = customSectionsOf(cv).filter((c) => c.id !== removed.key);
    list.splice(Math.min(removed.custom.index, list.length), 0, removed.custom.entry);
    next.customSections = list;
  }
  const order = orderOf(cv).filter((k) => k !== removed.key);
  order.splice(removed.orderIndex < 0 ? order.length : Math.min(removed.orderIndex, order.length), 0, removed.key);
  const dividers = { ...(cv.layout?.dividers ?? {}) };
  if (removed.divider !== undefined) dividers[removed.key] = removed.divider;
  next = withLayout(next, { sectionOrder: order, dividers });
  return next;
}

/** Section bawaan opsional (dan "Lainnya") yang sedang tidak dipakai. */
export function unusedBuiltinSections(cv: CvData): string[] {
  const order = orderOf(cv);
  const out: string[] = OPTIONAL_SECTIONS.filter((k) => !order.includes(k));
  if (!customSectionsOf(cv).some((c) => c.id === LAINNYA_ID)) out.push(LAINNYA_ID);
  return out;
}

/** Pakai lagi section bawaan opsional: masuk urutan di posisi bawaannya & ditampilkan. */
export function restoreBuiltinSection(cv: CvData, key: string): CvData {
  let next = { ...cv };
  if (key === LAINNYA_ID) {
    if (!customSectionsOf(cv).some((c) => c.id === LAINNYA_ID)) {
      next.customSections = [...customSectionsOf(cv), { id: LAINNYA_ID, title: "Lainnya", content: "", contentType: "bullets" }];
    }
  } else if (!isBuiltin(key)) {
    return cv;
  }
  const order = orderOf(cv);
  if (!order.includes(key)) {
    const di = (DEFAULT_SECTION_ORDER as string[]).indexOf(key);
    let pos = order.length;
    if (di >= 0) {
      pos = 0;
      for (let j = di - 1; j >= 0; j--) {
        const at = order.indexOf(DEFAULT_SECTION_ORDER[j]);
        if (at !== -1) {
          pos = at + 1;
          break;
        }
      }
    }
    order.splice(pos, 0, key);
  }
  const visibility = { ...(cv.layout?.sectionVisibility ?? {}), [key]: true };
  next = withLayout(next, { sectionOrder: order, sectionVisibility: visibility });
  return next;
}

export const canAddCustomSection = (cv: CvData) => customSectionsOf(cv).length < MAX_CUSTOM_SECTIONS;

/** Tambah section kustom baru di akhir urutan. Null bila sudah mencapai batas. */
export function addCustomSection(cv: CvData, title: string): { cv: CvData; id: string } | null {
  if (!canAddCustomSection(cv)) return null;
  const id = newId("cs");
  const entry: CustomSectionEntry = { id, title: title.trim().slice(0, 100), content: "", contentType: "bullets" };
  const next = { ...cv, customSections: [...customSectionsOf(cv), entry] };
  return { cv: withLayout(next, { sectionOrder: [...orderOf(cv), id] }), id };
}

export function updateCustomSection(cv: CvData, id: string, patch: Partial<Omit<CustomSectionEntry, "id">>): CvData {
  return { ...cv, customSections: customSectionsOf(cv).map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}
