/**
 * Satu tempat untuk logika tema, supaya pemilih di header, saklar di login,
 * dan grup tiga keadaan di footer tidak menyimpan salinan `apply()` sendiri.
 *
 * Pilihan disimpan di localStorage sebagai "light" | "dark" | "system".
 * `system` tidak menulis tema, hanya mengikuti preferensi OS.
 */
export type ThemeChoice = "light" | "dark" | "system";

/** Nama event yang dipakai semua instance pemilih tema untuk sinkron. */
export const THEME_EVENT = "themechange";
export const THEME_STORAGE_KEY = "theme";

export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Terapkan tema ke <html>. Skrip inline di layout memakai aturan yang sama. */
export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  const theme = resolveTheme(choice);
  root.dataset.theme = theme;
  root.dataset.themeChoice = choice;
  root.style.colorScheme = theme;
}

export function readThemeChoice(): ThemeChoice {
  const saved = typeof window === "undefined" ? null : localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

/** Simpan pilihan, terapkan, lalu beri tahu instance lain di halaman yang sama. */
export function setThemeChoice(choice: ThemeChoice) {
  localStorage.setItem(THEME_STORAGE_KEY, choice);
  applyTheme(choice);
  window.dispatchEvent(new CustomEvent<ThemeChoice>(THEME_EVENT, { detail: choice }));
}

export function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
