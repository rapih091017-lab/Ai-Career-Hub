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

type LayoutPatch = { sectionOrder?: string[]; dividers?: Record<string, boolean>; sectionVisibility?: Record<string, boolean>; removedSections?: string[] };

function withLayout(cv: CvData, patch: LayoutPatch): CvData {
  const base = cv.layout ?? { ...LEGACY_LAYOUT };
  return { ...cv, layout: { ...base, ...patch } };
}

export const removedSectionsOf = (cv: CvData): string[] => cv.layout?.removedSections ?? [];

/**
 * Hapus bagian = keluarkan dari urutan dan tandai di layout.removedSections.
 * Isi TIDAK dihapus, jadi "Pakai lagi" memulihkannya. Dihitung dari state
 * terbaru (dipakai di dalam updater setCvData).
 */
export function removeSection(cv: CvData, key: string): { cv: CvData; orderIndex: number } | null {
  if (!isRemovableSection(cv, key)) return null;
  const order = orderOf(cv);
  const removed = removedSectionsOf(cv);
  return {
    cv: withLayout(cv, {
      sectionOrder: order.filter((k) => k !== key),
      removedSections: removed.includes(key) ? removed : [...removed, key],
    }),
    orderIndex: order.indexOf(key),
  };
}

/** Section yang sedang tidak dipakai (dihapus dari CV, isinya mungkin masih ada). */
export function unusedBuiltinSections(cv: CvData): string[] {
  const order = orderOf(cv);
  const customIds = new Set(customSectionsOf(cv).map((c) => c.id));
  const out = removedSectionsOf(cv).filter((k) => isBuiltin(k) || customIds.has(k));
  // Data lama (sebelum removedSections): bagian opsional yang tidak ada di urutan.
  for (const k of OPTIONAL_SECTIONS) if (!order.includes(k) && !out.includes(k)) out.push(k);
  if (!customIds.has(LAINNYA_ID) && !out.includes(LAINNYA_ID)) out.push(LAINNYA_ID);
  return out;
}

/** Apakah bagian yang tidak dipakai masih punya isi tersimpan. */
export function sectionHasSavedContent(cv: CvData, key: string): boolean {
  if (key === "organizations") return cv.organisations.length > 0;
  if (key === "certifications") return (cv.certifications?.length ?? 0) > 0;
  if (key === "selfEvaluation") return !!cv.selfEvaluation?.trim();
  return !!customSectionsOf(cv).find((c) => c.id === key)?.content.trim();
}

/**
 * Pakai lagi bagian: keluar dari removedSections, masuk urutan (di
 * `orderIndex` bila diberikan, mis. dari Urungkan; selain itu posisi bawaan
 * atau akhir), dan ditampilkan. Isi yang tersimpan muncul lagi.
 */
export function restoreSection(cv: CvData, key: string, orderIndex?: number): CvData {
  let next = { ...cv };
  if (key === LAINNYA_ID && !customSectionsOf(cv).some((c) => c.id === LAINNYA_ID)) {
    next.customSections = [...customSectionsOf(cv), { id: LAINNYA_ID, title: "Lainnya", content: "", contentType: "bullets" }];
  } else if (!isBuiltin(key) && !customSectionsOf(cv).some((c) => c.id === key)) {
    return cv;
  }
  const order = orderOf(cv);
  if (!order.includes(key)) {
    let pos = order.length;
    if (orderIndex !== undefined && orderIndex >= 0) {
      pos = Math.min(orderIndex, order.length);
    } else {
      const di = (DEFAULT_SECTION_ORDER as string[]).indexOf(key);
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
    }
    order.splice(pos, 0, key);
  }
  const visibility = { ...(cv.layout?.sectionVisibility ?? {}), [key]: true };
  next = withLayout(next, {
    sectionOrder: order,
    sectionVisibility: visibility,
    removedSections: removedSectionsOf(cv).filter((k) => k !== key),
  });
  return next;
}

/** Nama lama, dipertahankan untuk pemanggil yang ada. */
export const restoreBuiltinSection = (cv: CvData, key: string) => restoreSection(cv, key);

/**
 * Hapus permanen isi bagian yang sudah tidak dipakai. Bagian bawaan tetap
 * tercatat tidak dipakai (kosong); bagian kustom dihapus seluruhnya.
 */
export function purgeSectionContent(cv: CvData, key: string): CvData {
  if (!unusedBuiltinSections(cv).includes(key)) return cv;
  let next: CvData = { ...cv };
  if (key === "organizations") next.organisations = [];
  else if (key === "certifications") next.certifications = [];
  else if (key === "selfEvaluation") next.selfEvaluation = "";
  else {
    next.customSections = customSectionsOf(cv).filter((c) => c.id !== key);
    const { [key]: _gone, ...dividers } = cv.layout?.dividers ?? {};
    next = withLayout(next, { removedSections: removedSectionsOf(cv).filter((k) => k !== key), dividers });
  }
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
