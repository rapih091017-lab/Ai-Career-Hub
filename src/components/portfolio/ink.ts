import type { ThemeColors } from "./types";

/** Luminans relatif WCAG 2.1. Hanya hex opak; nilai lain dianggap tidak terukur. */
function luminance(hex: string): number | null {
  const h = hex.trim().replace("#", "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) return null;
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Rasio kontras WCAG; 0 bila salah satu warna bukan hex opak. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return 0;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Tinta untuk teks di atas latar berwarna (badge, chip, tombol). Warna
 * section bisa diganti pengguna, jadi tinta tidak dipatok: dipilih yang
 * paling kontras di antara `text` dan `onPrimary` tema, lalu hitam/putih
 * sebagai cadangan terakhir.
 */
export function inkOn(bg: string, colors: Pick<ThemeColors, "text" | "onPrimary">): string {
  const candidates = [colors.text, colors.onPrimary, "#111111", "#FFFFFF"];
  let best = candidates[0];
  let bestRatio = -1;
  for (const c of candidates) {
    const r = contrastRatio(c, bg);
    if (r >= 4.5) return c;
    if (r > bestRatio) {
      best = c;
      bestRatio = r;
    }
  }
  return best;
}
