### Task 6: Font tema — `ThemeFonts` + perbaikan CSP/cdnfonts

**Files:**
- Create: `src/components/portfolio/render/ThemeFonts.tsx`
- Modify: `src/components/portfolio/themes.ts` (semua `fontUrl` → Google Fonts; Geist keluar dari cdnfonts)
- Modify: `src/app/portfolio/preview/page.tsx`, `src/components/portfolio/builder/BuilderEditor.tsx` (pasang ThemeFonts)
- Modify: `src/lib/portfolio/export-html.ts` (preconnect origin yang benar)
- Test: `src/__tests__/portfolio-theme-rules.test.ts` (blok font)

**Interfaces:**
- Produces: `<ThemeFonts themeId={id} />` — tanpa state, aman untuk server dan klien; mount di editor/preview (halaman publik `/p/` + export sudah punya pola sendiri, verifikasi tetap jalan).

- [ ] **Step 1: Tulis test font (gagal dulu)**

```ts
describe("font tema", () => {
  it("hanya origin Google Fonts di fontUrl", async () => {
    const { THEME_IDS } = await import("@/components/portfolio/types");
    for (const id of THEME_IDS) {
      expect(THEMES[id].fontUrl, `fontUrl ${id}`).toContain("fonts.googleapis.com");
      expect(THEMES[id].fontUrl).not.toContain("cdnfonts");
    }
  });

  it("ThemeFonts ada dan merender stylesheet untuk tema aktif", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/components/portfolio/render/ThemeFonts.tsx"), "utf8");
    expect(src).toContain('rel="stylesheet"');
    expect(src).toContain("preconnect");
    const preview = readFileSync(join(process.cwd(), "src/app/portfolio/preview/page.tsx"), "utf8");
    expect(preview).toContain("<ThemeFonts");
    const builder = readFileSync(
      join(process.cwd(), "src/components/portfolio/builder/BuilderEditor.tsx"), "utf8");
    expect(builder).toContain("<ThemeFonts");
  });

  it("export memuat preconnect Google yang benar", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/portfolio/export-html.ts"), "utf8");
    expect(src).not.toContain("cdnfonts");
  });
});
```

- [ ] **Step 2: Buat `ThemeFonts.tsx`**

```tsx
import { THEMES } from "../themes";

/**
 * Memuat font tema aktif (editor & preview). Halaman publik dan file export
 * sudah punya jalur masing-masing — komponen ini menutup celah builder yang
 * selama ini merender terhadap font fallback sistem.
 * next/font sengaja tidak dipakai: hasil /_next/static/… mati di file export mandiri.
 */
export default function ThemeFonts({ themeId }: { themeId: string }) {
  const theme = THEMES[themeId] ?? THEMES.glass;
  if (!theme.fontUrl) return null;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={theme.fontUrl} />
    </>
  );
}
```

(Hapus komentar yang tidak perlu; pastikan komentar menjelaskan mengapa bukan `next/font` dalam satu baris yang jujur.)

- [ ] **Step 3: Pasang di preview + builder, ganti fontUrl Glass ke Google Fonts**

- Carilah URL Geist di Google Fonts (`family=Geist:wght@400;500;700`), ganti `fontUrl` Glass.
- Verifikasi gaya `fontFamily` tema di kedua halaman tetap mengarah ke family yang sama dengan `theme.typography` / `theme.font`.
- `export-html.ts`: preconnect `<link>` meniru origin `fontUrl` (Google), bukan cdnfonts.

- [ ] **Step 4: Verifikasi + commit**

```bash
npx vitest run src/__tests__/portfolio-theme-rules.test.ts
npm test && npx tsc --noEmit
git add src/components/portfolio/render/ThemeFonts.tsx src/components/portfolio/themes.ts src/app/portfolio/preview/page.tsx src/components/portfolio/builder/BuilderEditor.tsx src/lib/portfolio/export-html.ts src/__tests__/portfolio-theme-rules.test.ts
git commit -m "fix(portfolio): ThemeFonts di editor, fontUrl Google-only, perbaiki CSP glass"
```

---
