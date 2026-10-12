import { describe, it, expect } from "vitest";
import { THEMES } from "@/components/portfolio/themes";
import { THEME_IDS } from "@/components/portfolio/types";

/** WCAG 2.1 relative luminance. Hanya hex opak; token transparan dicatat terpisah. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const isHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

describe("WCAG AA per tema", () => {
  it.each(THEME_IDS)("%s: pasangan teks utama >= 4.5", (id) => {
    const theme = THEMES[id];
    const c = theme.colors;
    const pairs: [string, string][] = [
      ["text", c.text],
      ["textSecondary", c.textSecondary],
      ["textMuted", c.textMuted],
      ["primary", c.primary],
    ];
    for (const [label, value] of pairs) {
      if (!isHex(value)) continue; // token transparan tidak bisa dihitung statis
      expect(contrast(value, c.bg), `${id}.${label} (${value})`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(THEME_IDS)("%s: onPrimary di atas primary >= 4.5", (id) => {
    const c = THEMES[id].colors;
    expect(isHex(c.onPrimary), `${id}: onPrimary harus hex opak`).toBe(true);
    expect(contrast(c.onPrimary, c.primary), `${id}: ${c.onPrimary} di ${c.primary}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(THEME_IDS)("%s: focus ring >= 3.0 (WCAG 1.4.11)", (id) => {
    const fr = THEMES[id].focusRing.color;
    expect(isHex(fr), `${id}: focusRing harus hex opak, dapat ${fr}`).toBe(true);
    expect(contrast(fr, THEMES[id].colors.bg), `${id}: focusRing ${fr}`).toBeGreaterThanOrEqual(3);
  });

  it.each(THEME_IDS)("%s: primary tiap sectionColors >= 4.5", (id) => {
    const theme = THEMES[id];
    for (const [section, colors] of Object.entries(theme.sectionColors ?? {})) {
      const primary = (colors as { primary?: string }).primary;
      if (!primary || !isHex(primary)) continue;
      expect(
        contrast(primary, theme.colors.bg),
        `${id}.${section}.primary (${primary})`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});