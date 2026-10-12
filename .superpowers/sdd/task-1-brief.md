### Task 1: Token layer di `ThemeDefinition`

**Files:**
- Modify: `src/components/portfolio/types.ts` (interface `ThemeDefinition`)
- Modify: `src/components/portfolio/themes.ts` (isi 3 tema, hapus `cssVars`)
- Test: `src/__tests__/portfolio-theme-rules.test.ts` (baru — hanya blok paritas + kelengkapan token)

**Interfaces:**
- Produces:
  ```ts
  export type ThemeRadii = { card: string; button: string; pill: string; image: string };
  export type ThemeBlur = { card: string; glow: string };
  export type ThemeShadow = { card: string; focus: string };
  export type ThemeTypography = { display: string; body: string; eyebrow: string };
  export type ThemeFocusRing = { color: string; width: string };
  // di ThemeDefinition:
  radii: ThemeRadii; blur: ThemeBlur; shadow: ThemeShadow;
  typography: ThemeTypography; focusRing: ThemeFocusRing;
  ```
- Konsumen berikutnya: semua task 2–7.

- [ ] **Step 1: Tulis test paritas + kelengkapan (gagal dulu)**

`src/__tests__/portfolio-theme-rules.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { THEMES, TEMPLATE_PREVIEWS } from "@/components/portfolio/themes";
import { THEME_IDS } from "@/components/portfolio/types";

describe("token layer", () => {
  it("THEME_IDS dan Object.keys(THEMES) saling paritas", () => {
    expect([...THEME_IDS].sort()).toEqual(Object.keys(THEMES).sort());
    expect(Object.keys(TEMPLATE_PREVIEWS).sort()).toEqual([...THEME_IDS].sort());
  });

  it("setiap tema punya token lengkap", () => {
    for (const id of THEME_IDS) {
      const t = THEMES[id];
      for (const group of ["radii", "blur", "shadow", "typography", "focusRing"] as const) {
        expect(t[group], `tema ${id} kehilangan ${group}`).toBeDefined();
      }
      expect(t.radii.card).toBeTruthy();
      expect(t.typography.display).toBeTruthy();
      expect(t.focusRing.color).toBeTruthy();
    }
  });

  it("cssVars sudah dihapus dari definisi", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const types = readFileSync(join(process.cwd(), "src/components/portfolio/types.ts"), "utf8");
    const themes = readFileSync(join(process.cwd(), "src/components/portfolio/themes.ts"), "utf8");
    expect(types).not.toContain("cssVars");
    expect(themes).not.toContain("cssVars");
  });

  it("focusRing tidak lagi memakai teal app", () => {
    for (const id of THEME_IDS) {
      expect(THEMES[id].focusRing.color.toLowerCase()).not.toBe("#0d7377");
    }
  });
});
```

- [ ] **Step 2: Jalankan — gagal (field token belum ada)**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts`

- [ ] **Step 3: Tambah field ke `ThemeDefinition`**

Di `src/components/portfolio/types.ts`, setelah `colors: ThemeColors;` dan **sebelum** `sectionColors` (jangan sentuh kunci lama):

```ts
export interface ThemeRadii { card: string; button: string; pill: string; image: string }
export interface ThemeBlur { card: string; glow: string }
export interface ThemeShadow { card: string; focus: string }
export interface ThemeTypography { display: string; body: string; eyebrow: string }
export interface ThemeFocusRing { color: string; width: string }
```

Di `ThemeDefinition`: tambahkan `radii`, `blur`, `shadow`, `typography`, `focusRing`. **Hapus** baris `cssVars: Record<string, string>;`.

- [ ] **Step 4: Isi nilai token di `themes.ts` (petunjuk: baca literal yang dipakai section dulu)**

Sebelum menulis, petakan literal nyata per tema dengan `rg "borderRadius|boxShadow|backdrop-blur|fontFamily" src/components/portfolio/sections/`. Lalu isi (contoh bentuk; sesuaikan angka dengan literal yang benar-benar ada):

```ts
// glass (setelah warna)
radii: { card: "1.5rem", button: "0.75rem", pill: "9999px", image: "1.5rem" },
blur:  { card: "backdrop-blur(12px)", glow: "blur(60px)" },
shadow: { card: "0 8px 32px rgba(0,0,0,0.35)", focus: "0 0 0 3px rgba(167,139,250,0.55)" },
typography: { display: "'Geist', sans-serif", body: "'Geist', sans-serif", eyebrow: "'Geist', sans-serif" },
focusRing: { color: "#A78BFA", width: "3px" },
// brutal
radii: { card: "0", button: "0", pill: "0", image: "0" },
blur:  { card: "", glow: "" },
shadow: { card: "6px 6px 0 0 currentColor", focus: "0 0 0 3px #FF3366" },
typography: { display: "'Space Grotesk', sans-serif", body: "'Space Grotesk', sans-serif", eyebrow: "'Space Grotesk', sans-serif" },
focusRing: { color: "#D6004F", width: "3px" }, // nilai akhir ditentukan T5 bila kontras gagal
// luxe
radii: { card: "1rem", button: "0.5rem", pill: "9999px", image: "1rem" },
blur:  { card: "", glow: "blur(50px)" },
shadow: { card: "none", focus: "0 0 0 3px #B8863C" },
typography: { display: "'Playfair Display', serif", body: "'Sora', sans-serif", eyebrow: "'Sora', sans-serif" },
focusRing: { color: "#8A6420", width: "3px" },
```

`DEFAULT_SECTION_ORDER`, `DEFAULT_THEME_ID`, `TEMPLATE_PREVIEWS` tidak disentuh. Hapus properti `cssVars` di ketiga tema.

- [ ] **Step 5: Jalankan test + seluruh suite**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts` lalu `npm test`
Expected: token test PASS; suite penuh hijau (hapus `cssVars` tak boleh memecah apa pun — bila ada pembaca yang tidak terduga ketahuan di step ini, berhenti dan laporkan).

- [ ] **Step 6: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/components/portfolio/types.ts src/components/portfolio/themes.ts src/__tests__/portfolio-theme-rules.test.ts
git commit -m "feat(portfolio): token layer radii/blur/shadow/typography/focusRing, hapus cssVars"
```

---
