### Task 5: Kontras AA — rumus WCAG di test + geser nilai warna

**Files:**
- Create: `src/__tests__/portfolio-contrast.test.ts`
- Modify: `src/components/portfolio/themes.ts` (nilai warna 3 tema + `sectionColors`)
- Modify: test hex lama yang mengunci warna: `src/__tests__/portfolio-export.test.ts`, `src/__tests__/portfolio-document.test.tsx`, `src/__tests__/portfolio-dead-code.test.ts`

**Interfaces:**
- Produces: `contrastRatio(hexA, hexB): number` di dalam test (tanpa dependensi), semua pasangan ≥ ambang.

- [ ] **Step 1: Tulis test kontras (gagal untuk warna saat ini)**

`src/__tests__/portfolio-contrast.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { THEMES } from "@/components/portfolio/themes";
import { THEME_IDS } from "@/components/portfolio/types";

/** WCAG 2.1 relative luminance. Hex 3/6 digit, opasitas di luar cakupan (dilaporkan terpisah). */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
/** Hitung rasio putih terhadap warna sumber (untuk badge putih-di-primary). */
function whiteOn(hex: string): number {
  return contrast("#ffffff", hex);
}

describe("WCAG AA per tema", () => {
  it.each([...THEME_IDS])("%s: pasangan teks utama ≥ 4.5", (id) => {
    const c = THEMES[id].colors;
    const pairs: [string, string][] = [
      ["text", c.text],
      ["textSecondary", c.textSecondary],
      ["textMuted", c.textMuted],
      ["primary", c.primary],
    ];
    for (const [label, value] of pairs) {
      // token transparan/rgba dilewati dengan catatan di laporan
      if (!value.startsWith("#")) continue;
      expect(contrast(value, c.bg), `${id}.${label} (${value})`).toBeGreaterThanOrEqual(4.5);
    }
    expect(whiteOn(c.primary), `${id}: putih di atas primary`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.focusRing?.color ?? "#000", c.bg), `${id}: focus ring`).toBeGreaterThanOrEqual(3);
  });

  it.each([...THEME_IDS])("%s: setiap warna sectionColors utama ≥ 4.5", (id) => {
    const theme = THEMES[id];
    const sc = theme.sectionColors ?? {};
    for (const [section, colors] of Object.entries(sc)) {
      const primary = (colors as { primary?: string }).primary;
      if (!primary || !primary.startsWith("#")) continue;
      expect(contrast(primary, theme.colors.bg), `${id}.${section} primary ${primary}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

Catatan: `focusRing` ada di objek tema hasil Task 1; bila akses `colors.focusRing` tidak ada, pakai `THEMES[id].focusRing.color`. Sesuaikan referensi agar kompilasi bersih.

- [ ] **Step 2: Jalankan — pantau daftar kegagalan sebagai daftar kerja**

Run: `npx vitest run src/__tests__/portfolio-contrast.test.ts`
Output daftar pasangan yang gagal. Catat semuanya.

- [ ] **Step 3: Geser nilai warna (karakter sama, nilai pekat/terang)**

Di `themes.ts`, ubah HANYA nilai yang gagal — hue dipertahankan:
- Luxe: emas `#B8863C` → kuningan lebih tua (target ≥4.5 vs `#FDFBF7`), body `#8C7A6A` → cokelat tua (≥4.5), `focusRing` ikut emas tua.
- Brutal: aksen `#FF3366` → merah lebih pekat (≥4.5 vs `#FFFAF0`), statistik kuning `#FFCC00` di `sectionColors` → kuning-jingga pekat yang lolos ≥4.5 (bila mustahil tanpa kehilangan "kuning", ganti pasangan primary section itu ke warna teks gelap dan catat di laporan).
- Glass: ungu `#7C5CFC` → violet terang (≥4.5 vs `#12121F`), `focusRing` → violet terang.
Geser `borderHover`, `primaryGlow` yang berkaitan agar tidak ada pasangan baru yang turun di bawah ambang.

- [ ] **Step 4: Perbarui test yang mengunci hex/copy lama**

`rg -n "#FFFAF0|#3366ff|#ff3366|#6dd5fa|#7C5CFC" src/__tests__/` → ganti nilai dalam assertion dengan nilai BARU hasil Step 3 (assertion tetap menuntut warna itu muncul di markup).

- [ ] **Step 5: Verifikasi + commit**

```bash
npx vitest run src/__tests__/portfolio-contrast.test.ts
npm test && npx tsc --noEmit
git add src/components/portfolio/themes.ts src/__tests__/portfolio-contrast.test.ts src/__tests__/
git commit -m "fix(portfolio): kontras WCAG AA semua tema, rumus rasio di test"
```

---
