/**
 * Serah terima teks CV dari hasil cek ke /builder/new.
 *
 * Teks disimpan di sessionStorage (hanya tab ini, hilang saat tab ditutup),
 * bukan di URL, karena isinya data pribadi dan bisa panjang. sessionStorage
 * tetap ada setelah putaran login Google di tab yang sama.
 */
export const CHECKER_CV_TEXT_KEY = "checker_cv_text";
export const CHECKER_SOURCE_KEY = "checker_source";
/** Batas panjang teks yang dikirim ke generator CV. */
export const CHECKER_CV_TEXT_MAX = 20_000;
/** Tujuan tombol "Perbaiki di builder". */
export const BUILDER_FROM_CHECKER_PATH = "/builder/new?from=checker";

export function saveCheckerHandoff(cvText: string, sourceUrl: string): boolean {
  const text = cvText.trim().slice(0, CHECKER_CV_TEXT_MAX);
  if (text.length < 20) return false;
  try {
    sessionStorage.setItem(CHECKER_CV_TEXT_KEY, text);
    sessionStorage.setItem(CHECKER_SOURCE_KEY, sourceUrl);
    return true;
  } catch {
    return false;
  }
}

export function readCheckerCvText(): string | null {
  try {
    const text = sessionStorage.getItem(CHECKER_CV_TEXT_KEY);
    return text && text.trim().length >= 20 ? text : null;
  } catch {
    return null;
  }
}

export function clearCheckerCvText(): void {
  try {
    sessionStorage.removeItem(CHECKER_CV_TEXT_KEY);
  } catch {
    /* abaikan */
  }
}
