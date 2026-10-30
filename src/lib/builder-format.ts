/**
 * Baca format builder tersimpan (`cv_fmt_<id>`) dari localStorage.
 * Mengembalikan null bila kosong, rusak, atau storage tidak bisa diakses.
 */
export function readSavedFormat(key: string): Record<string, any> | null {
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
