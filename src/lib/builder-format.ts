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
