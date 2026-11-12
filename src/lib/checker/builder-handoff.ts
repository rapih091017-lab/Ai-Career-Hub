/**
 * Serah terima teks CV dari hasil cek ke /builder/new.
 *
 * Teks disimpan di sessionStorage (hanya tab ini, hilang saat tab ditutup),
 * bukan di URL, karena isinya data pribadi dan bisa panjang. sessionStorage
 * tetap ada setelah putaran login Google di tab yang sama. Isinya diberi
 * stempel waktu dan kedaluwarsa setelah 30 menit; builder menghapusnya
 * begitu sudah dibaca atau ditolak.
 */
export const CHECKER_CV_TEXT_KEY = "checker_cv_text";
export const CHECKER_SOURCE_KEY = "checker_source";
/** Batas panjang teks yang dikirim ke generator CV. */
export const CHECKER_CV_TEXT_MAX = 20_000;
/** Umur maksimum titipan teks CV. */
export const CHECKER_HANDOFF_TTL_MS = 30 * 60 * 1000;
/** Tujuan tombol "Perbaiki di builder". */
export const BUILDER_FROM_CHECKER_PATH = "/builder/new?from=checker";

export function saveCheckerHandoff(cvText: string, sourceUrl: string): boolean {
  const text = cvText.trim().slice(0, CHECKER_CV_TEXT_MAX);
  if (text.length < 20) return false;
  try {
    sessionStorage.setItem(CHECKER_CV_TEXT_KEY, JSON.stringify({ text, at: Date.now() }));
    sessionStorage.setItem(CHECKER_SOURCE_KEY, sourceUrl);
    return true;
  } catch {
    return false;
  }
}

/** Teks CV titipan bila masih berlaku; titipan kedaluwarsa atau rusak dihapus. */
export function readCheckerCvText(now: number = Date.now()): string | null {
  try {
    const raw = sessionStorage.getItem(CHECKER_CV_TEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { text?: unknown; at?: unknown };
    const valid =
      typeof parsed.text === "string" &&
      parsed.text.trim().length >= 20 &&
      typeof parsed.at === "number" &&
      now - parsed.at >= 0 &&
      now - parsed.at <= CHECKER_HANDOFF_TTL_MS;
    if (!valid) {
      clearCheckerHandoff();
      return null;
    }
    return parsed.text as string;
  } catch {
    clearCheckerHandoff();
    return null;
  }
}

/** Hapus teks CV titipan dan alamat hasil cek asalnya. */
export function clearCheckerHandoff(): void {
  try {
    sessionStorage.removeItem(CHECKER_CV_TEXT_KEY);
    sessionStorage.removeItem(CHECKER_SOURCE_KEY);
  } catch {
    /* abaikan */
  }
}
