import type { SectionId, SectionVisibility } from "./types";

/**
 * Aturan tunggal untuk membaca peta visibilitas yang sengaja parsial: section
 * yang tidak disebut dianggap tampil. Editor (PortfolioCanvas) dan halaman
 * publik (PortfolioDocument mode static) wajib lewat helper ini, kalau tidak keduanya
 * bisa berbeda pendapat soal peta yang sebagian terisi dan preview editor
 * kehilangan section yang tetap tampil di halaman publik.
 */
export const isSectionVisible = (
  visibility: SectionVisibility | undefined,
  id: SectionId,
): boolean => !visibility || visibility[id] !== false;

/** Urutan section yang benar-benar dirender, sesuai aturan di atas. */
export const resolveVisibility = (
  order: readonly SectionId[],
  visibility: SectionVisibility | undefined,
): SectionId[] => order.filter((id) => isSectionVisible(visibility, id));
