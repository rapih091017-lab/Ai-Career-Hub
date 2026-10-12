# Portfolio Spec 2 — Fondasi Tema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap tema punya signature mekanis yang dijaga test — bukan recolor — dengan kontras AA, font tema terpakai konsisten di 4 konsumen, dan copy publik satu suara Indonesia.

**Architecture:** Token bertipe di `ThemeDefinition` dikonsumsi sebagai inline-style; enforcement dua-layer Vitest (larangan sumber + asersi markup render + DOM-fingerprint pasangan); kontras dihitung rumus WCAG di test; font lewat `<link>` Google Fonts + komponen `ThemeFonts`; 6 section kembar dipecah jadi komposisi asli per tema.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, Vitest (+ Testing Library, `renderToStaticMarkup`), `motion` (bukan framer-motion), token inline-style (tanpa CSS-var layer).

**Spec:** `docs/superpowers/specs/2026-10-12-portfolio-theme-foundation-design.md`

## Global Constraints

- **Kunci `ThemeColors` lama tidak boleh pernah di-rename** (rename membuang `sectionColors` user di jsonb tanpa error). Token baru bersifat additive-only.
- Token baru: `radii {card,button,pill,image}`, `blur {card,glow}`, `shadow {card,focus}`, `typography {display,body,eyebrow}` (family string), `focusRing {color,width}`.
- Setelah Task 2/3: **nol** literal `rounded-*`, `shadow-*`, `backdrop-blur*`, hex di luar allowlist `#fff`/`#ffffff`, inline `borderRadius:"`/`boxShadow:"`, dan inline `fontFamily` di `src/components/portfolio/sections/**` dan `src/components/portfolio/render/**`.
- Kunci kontras (semua ≥4.5 terhadap `bg`, kecuali `focusRing` ≥3.0 dan hairline dekoratif): `text`, `textSecondary`, `textMuted`, `primary`, putih-di-`primary`, setiap `sectionColors[*].primary`.
- `fontUrl` hanya Google Fonts (perbaiki `fonts.cdnfonts.com` pada Glass). Font-family: Geist, Space Grotesk, Playfair Display + Sora, Instrument Sans (Spec 2.5).
- Copy publik: Indonesia fasih, tanpa "View Work"/"INTRODUCING"/"Selected Projects"/"Core Competencies". Batas teks `text-xs`; target sentuh 44×44; tanpa kontrol mati.
- **Tanpa `lucide-react` dan tanpa `framer-motion`** (keputusan konsultan). Ikon brand = SVG inline yang sudah ada.
- Semua task: `npx tsc --noEmit` + `npm test` hijau sebelum commit. Antislop (ui/code/copy) dijalankan saat pengerjaan.
- Default ThemeId tetap `glass`. `resolveTheme` fallback glass untuk id asing (perilaku tak berubah).

## File Structure

- Modify: `src/components/portfolio/types.ts` (tambah field token ke `ThemeDefinition`, hapus `cssVars`)
- Modify: `src/components/portfolio/themes.ts` (isi token 3 tema, perbaiki nilai kontras + fontUrl)
- Modify: semua `src/components/portfolio/sections/*.tsx` (12 file: token, komposisi, copy)
- Create: `src/components/portfolio/render/ThemeFonts.tsx`
- Create: `src/__tests__/portfolio-theme-rules.test.ts` (Layer A + Layer B + paritas + switch-case)
- Create: `src/__tests__/portfolio-theme-fingerprint.test.ts` (kerangka pasangan, daftar pending 6)
- Create: `src/__tests__/portfolio-contrast.test.ts` (rumus WCAG)
- Modify: `src/app/portfolio/preview/page.tsx`, `src/components/portfolio/builder/BuilderEditor.tsx` (ThemeFonts)
- Modify: `src/app/portfolio/page.tsx` (thumbnail picker nyata + deskripsi)
- Modify: test yang mengunci hex/copy lama: `portfolio-export.test.ts`, `portfolio-document.test.tsx`, `portfolio-dead-code.test.ts`

---

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

### Task 2: Migrasi token file A + test larangan sumber (Layer A)

**Files:**
- Modify: `src/components/portfolio/sections/HeroSection.tsx`, `AboutSection.tsx`, `StatsSection.tsx`, `ProjectsSection.tsx`, `SkillsSection.tsx`, `ContactSection.tsx`
- Modify: `src/__tests__/portfolio-theme-rules.test.ts` (tambah blok Layer A)

**Interfaces:**
- Consumes: token dari Task 1 (`theme.radii.card`, `theme.blur.card`, `theme.shadow.card`, `theme.typography.display`, `theme.focusRing`).
- Produks: keenam file bebas literal; Layer A test hijau untuk keenam file (file lain menyusul di Task 3 — test sudah menyapu semua, jadi Task 2 hanya boleh menyalakan subset atau menulis penuh + Task 3 menyelesaikan: **pilih menulis penuh dan pasang `expect` per-file di akhir Task 3** — instruksi: tulis test penuh sekarang dengan pasangan file→daftar, `it.each` per file; file Task 3 ditandai `todo` sementara dan dihapus tandanya di Task 3).

- [ ] **Step 1: Tulis test Layer A (gagal untuk file yang belum dimigrasi)**

Tambahkan ke `portfolio-theme-rules.test.ts`:

```ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SECTIONS_DIR = join(process.cwd(), "src/components/portfolio/sections");
const RENDER_DIR = join(process.cwd(), "src/components/portfolio/render");

/** Literal yang dilarang — wajib lewat token tema. */
const BANNED: { label: string; re: RegExp }[] = [
  { label: "rounded-*", re: /\brounded-(full|[a-z0-9]+)\b/ },
  { label: "shadow-*", re: /\bshadow-(sm|md|lg|xl|2xl|premium[\w-]*)\b/ },
  { label: "backdrop-blur*", re: /\bbackdrop-blur\b/ },
  { label: "borderRadius literal", re: /borderRadius:\s*["'`]/ },
  { label: "boxShadow literal", re: /boxShadow:\s*["'`]/ },
  { label: "inline fontFamily", re: /fontFamily:\s*["'`]/ },
  { label: "hex warna", re: /#[0-9a-fA-F]{6}\b/ },
];

// File yang belum dimigrasi: Task 3 menyelesaikannya. Hapus entri ini di Task 3.
const PENDING_FILES = [
  "ExperienceSection.tsx", "EducationSection.tsx", "CertificationsSection.tsx",
  "OrganizationsSection.tsx", "HobbiesSection.tsx", "TestimonialsSection.tsx",
];

const sourceFiles = [
  ...readdirSync(SECTIONS_DIR).map((f) => join(SECTIONS_DIR, f)),
  ...readdirSync(RENDER_DIR).filter((f) => f.endsWith(".tsx")).map((f) => join(RENDER_DIR, f)),
];

function stripAllowed(src: string): string {
  // allowlist putih; komentar diabaikan agar aturan tidak menangkap diskusi
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/#fff(?:fff)?\b/gi, "");
}

describe("Layer A: larangan literal di section & render", () => {
  it.each(sourceFiles.map((f) => [f]))("%s bebas literal", (file: string) => {
    const name = file.split(/[\\/]/).pop()!;
    if (PENDING_FILES.includes(name)) return; // Task 3 menghapus entri ini
    const src = stripAllowed(readFileSync(file, "utf8"));
    const found = BANNED.filter((b) => b.re.test(src)).map((b) => b.label);
    expect(found, `${name}: literal terlarang`).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan — 6 file Task 3 (todo) lolos; keenam file Task 2 gagal**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts`
Expected: kegagalan berisi daftar literal di file Task 2.

- [ ] **Step 3: Migrasi 6 file — pola pertukaran**

Untuk SETIAP literal, ganti dengan token. Pola:

```tsx
// SEBELUM (contoh nyata AboutSection)
style={{ borderRadius: "1.5rem", boxShadow: "0 8px 32px rgba(0,0,0,.35)", backdropFilter: "blur(12px)" }}
style={{ fontFamily: "Playfair Display, serif" }}
className="text-[24px] font-bold"

// SESUDAH
style={{ borderRadius: theme.radii.card, boxShadow: theme.shadow.card, backdropFilter: theme.blur.card }}
style={{ fontFamily: theme.typography.display }}
```

Aturan per templat ketiga varian di tiap file:
- `borderRadius` literal → `theme.radii.*` (`card`/`button`/`pill`/`image`, pilih yang paling sesuai per pemakaian; nilai Brutal otomatis `"0"`).
- `boxShadow` literal → `theme.shadow.card` (bila bayangannya berbeda per posisi, pakai `card` juga — satu bayangan per tema adalah bagian signature).
- `backdropFilter`/`blur(` literal → gabung `theme.blur.card` + `theme.blur.glow` bila keduanya dipakai di tempat berbeda; kosongkan string bila token kosong (Brutal).
- `fontFamily` inline → `theme.typography.display` / `.body` / `.eyebrow`.
- Hex di JSX → warna dari `theme.colors.*`. Hex **hanya** `#fff`/`#ffffff` (stroke) diperbolehkan. Khusus hex yang tersembunyi di `previewGradient`/SVG `stroke` — `previewGradient` (theme-level, bukan file section) di luar scan; `stroke="#fff"` aman.
- Class Tailwind `rounded-*`/`shadow-*` → pindah ke objek `style` token atau hapus bila redundan.

Nilai token Task 1 bisa terbukti tidak cocok dengan literal yang dihapus (mis. ada 3 ukuran radius berbeda dalam satu tema). Dalam kasus itu: **jangan** menambah field token baru tanpa menambahkannya ke `ThemeDefinition` + ketiga tema + test kelengkapan. Laporkan di laporan bila menambah.

- [ ] **Step 4: Jalankan Layer A untuk keenam file (hijau) + seluruh suite**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts` lalu `npm test`, `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/sections/HeroSection.tsx src/components/portfolio/sections/AboutSection.tsx src/components/portfolio/sections/StatsSection.tsx src/components/portfolio/sections/ProjectsSection.tsx src/components/portfolio/sections/SkillsSection.tsx src/components/portfolio/sections/ContactSection.tsx src/__tests__/portfolio-theme-rules.test.ts
git commit -m "refactor(portfolio): migrasi token 6 section pertama, Layer A larangan literal"
```

---

### Task 3: Migrasi token file B + buka todo Layer A

**Files:**
- Modify: `src/components/portfolio/sections/ExperienceSection.tsx`, `EducationSection.tsx`, `CertificationsSection.tsx`, `OrganizationsSection.tsx`, `HobbiesSection.tsx`, `TestimonialsSection.tsx`
- Modify: `src/__tests__/portfolio-theme-rules.test.ts` (hapus `PENDING_FILES`)

**Interfaces:**
- Sama dengan Task 2; setelah ini Layer A menyapu semua file tanpa pengecualian.

- [ ] **Step 1: Tulis test yang menuntut ke enam file (gagal)**

Jika `PENDING_FILES` masih berisi entri, test tetap lolos — jadi langkah pertama: **hapus `PENDING_FILES`** dan jalankan.

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts` → gagal di ke-enam file.

- [ ] **Step 2: Migrasi ke-enam file dengan pola identik Task 2 Step 3**

- Perhatian khusus `ExperienceSection`: `boxShadow` kartu timeline + `borderRadius` varian Luxe; `EducationSection`: stepper Brutal (harus jadi siku, `radii: 0` alami); `HobbiesSection` & `TestimonialsSection`: chip/rounded-full pill → `theme.radii.pill`.

- [ ] **Step 3: Verifikasi penuh**

```bash
npx vitest run src/__tests__/portfolio-theme-rules.test.ts   # 0 gagal, 0 pending
npm test
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/sections src/__tests__/portfolio-theme-rules.test.ts
git commit -m "refactor(portfolio): migrasi token 6 section sisa, Layer A tanpa pengecualian"
```

---

### Task 4: Layer B semantik + DOM-fingerprint pasangan

**Files:**
- Modify: `src/__tests__/portfolio-theme-rules.test.ts` (blok Layer B + switch-case)
- Create: `src/__tests__/portfolio-theme-fingerprint.test.ts`

**Interfaces:**
- Consumes: `PortfolioDocument` (mode `static`, renderToStaticMarkup), `THEMES`, `THEME_IDS`.

- [ ] **Step 1: Tulis test Layer B + switch-case (gagal bila ada yang belum)**

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";

const miniData = { formData: { heroFirstName: "A", heroLastName: "B", aboutText: "x" } } as never;

function staticFor(id: string) {
  return renderToStaticMarkup(
    createElement(PortfolioDocument, { data: miniData, themeId: id as never, mode: "static" }),
  );
}

describe("Layer B: aturan semantik per tema terlihat di markup", () => {
  it("token data memegang aturan signature", () => {
    for (const id of ["card", "button", "pill", "image"] as const) {
      expect(THEMES.brutal.radii[id]).toBe("0");
    }
    expect(THEMES.glass.blur.card).not.toBe("");
    expect(THEMES.luxe.shadow.card).toBe("none");
  });

  it("markup Glass memuat backdrop blur; Brutal tanpa radius non-nol; Luxe tanpa bayangan", () => {
    const glass = staticFor("glass");
    expect(glass).toContain("backdrop-filter:blur(");
    const brutal = staticFor("brutal");
    const radii = [...brutal.matchAll(/border-radius:\s*([^;"]+)/g)].map((m) => m[1].trim());
    expect(radii.filter((r) => r !== "0" && r !== "0px" && !r.startsWith("9999"))).toEqual([]);
    const luxe = staticFor("luxe");
    const shadows = [...luxe.matchAll(/box-shadow:\s*([^;"]+)/g)].map((m) => m[1].trim());
    expect(shadows.filter((s) => s !== "none" && s !== "")).toEqual([]);
  });

  it("setiap tema punya case eksplisit di switch section (bukan default diam-diam ke glass)", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "src/components/portfolio/sections");
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), "utf8");
      for (const id of THEME_IDS) {
        expect(src, `${f} tidak menangani tema ${id}`).toMatch(new RegExp(`["']${id}["']`));
      }
    }
  });

  it("Luxe memakai serif dan berwarna (kroma > 0)", () => {
    expect(THEMES.luxe.typography.display).toMatch(/serif/i);
    // Luxe minimal punya satu warna non-netral; uji silang lengkap menutup Spec 2.5
    expect(THEMES.luxe.colors.bg).not.toBe("#FFFFFF");
  });
});
```

- [ ] **Step 2: Jalankan — perbaiki apa pun yang gagal di kode (bukan di test)**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts`
Kegagalan yang sah berarti ada section masih bawa radius/bayangan non-token (task 2/3 terlewat) atau switch-case hilang — perbaiki file section-nya. Test jangan diubah agar lolos.

- [ ] **Step 3: Tulis fingerprint test (hijau untuk 6 yang sudah beda, daftar pending untuk 6 kembar)**

`src/__tests__/portfolio-theme-fingerprint.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PortfolioDocument } from "@/components/portfolio/render/PortfolioDocument";

const SECTIONS = join(process.cwd(), "src/components/portfolio/sections");
const THEME_IDS = ["glass", "brutal", "luxe"] as const;

/** Kerangka = urutan struktur HTML dalam satu cabang tema; abaikan teks, warna, angka.
 *  Tiap file section memuat ketiga varian dalam satu file (switch per tema), jadi
 *  potong berkas tepat pada cabang `case "<tema>":` sebelum menyalakan fingerprint. */
function branchSlice(src: string, themeId: string): string {
  const start = src.indexOf(`case "${themeId}":`);
  if (start === -1) return "";
  const rest = src.slice(start + themeId.length + 10);
  const nextCase = rest.search(/case "|default:/);
  return nextCase === -1 ? rest : rest.slice(0, nextCase);
}
function skeleton(src: string, themeId: string): string {
  return branchSlice(src, themeId)
    .replace(/\/\/[^\n]*/g, "")
    .replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '""')
    .replace(/\s+/g, "");
}

/** Section yang kerangkanya BELUM dibedakan per tema (diisi ulang oleh Task 7). */
const PENDING_SECTIONS: string[] = []; // Task 7 memastikan tetap kosong

const files = readdirSync(SECTIONS).filter((f) => f.endsWith(".tsx"));

describe("DOM-fingerprint: kerangka berbeda antar tema", () => {
  it("tiap file section punya cabang komposisi berbeda per tema", () => {
    for (const f of files) {
      if (PENDING_SECTIONS.includes(f)) continue;
      const src = readFileSync(join(SECTIONS, f), "utf8");
      const hashes = THEME_IDS.map((t) => skeleton(src, t));
      // tiga cabang tema tidak boleh identik dalam satu file
      expect(
        new Set(hashes.filter(Boolean)).size,
        `${f}: cabang tema sama atau case tidak ditemukan`,
      ).toBeGreaterThan(1);
      expect(hashes.every(Boolean), `${f}: ada case tema yang hilang`).toBe(true);
    }
  });
});
```

Catatan wajib di laporan: fingerprint file-level adalah proksi kasar (file memuat 3 varian dalam 1 file). Bila saat penulisan test terbukti tidak diskriminatif (mis. hanya beda string warna kecil), ganti menjadi render nyata per varian via `PortfolioDocument` + ekstraksi kerangka DOM dari HTML hasil `renderToStaticMarkup` (struktur `<section>`/wrapper), dan laporkan perubahannya. Yang tidak boleh: membiarkan test yang selalu lolos.

- [ ] **Step 4: Verifikasi + commit**

```bash
npm test && npx tsc --noEmit
git add src/__tests__/portfolio-theme-rules.test.ts src/__tests__/portfolio-theme-fingerprint.test.ts
git commit -m "test(portfolio): Layer B semantik + fingerprint antar-tema"
```

---

---

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

### Task 7: Re-compose section A — About, Experience, Education (× 3 tema)

**Files:**
- Modify: `src/components/portfolio/sections/AboutSection.tsx`, `ExperienceSection.tsx`, `EducationSection.tsx`

**Interfaces:**
- Consumes: token, kontras, `resolveVisibility` tidak berubah; props per section tidak berubah (jangan ubah signature — `PortfolioDocument` bergantung padanya).

- [ ] **Step 1: Baca pola varian + tetapkan struktur per tema (deskripsi singkat di laporan)**

Untuk tiap section tetapkan kerangka yang BERBEDA struktural antar tema:
- **Glass**: kartu efek kaca / bento / kolom kontras (acuan yang sudah ada — jangan dipakai ulang utuh di tema lain).
- **Brutal**: blok bernomor atau strip dengan bayangan hard, sudut siku, rotasi halus, border tebal.
- **Luxe**: baris hairline / kolom asimetris dengan serif sebagai hierarki — **tanpa kartu** (kini melanggar aturan Luxe; re-compose ini memperbaikinya).

- [ ] **Step 2: Implementasi — komposisi benar-benar berbeda, bukan restyle**

Aturan: urutan elemen, mekanisme hierarki (kartu vs baris vs kolom), dan struktur layout berbeda; tidak boleh hanya nilai warna/radius. `switch (theme.id)` punya case eksplisit per tema. `onSectionClick`, id anchor, dan `resolveVisibility` tidak berubah.

- [ ] **Step 3: Copy Indonesia**

Ganti string Inggris yang menyentuh ketiga section ini (mis. `Core Competencies`, label eyebrow Inggris) dengan bahasa Indonesia fasih. Konsisten antar tema.

- [ ] **Step 4: Verifikasi**

```bash
npm test   # Layer A + Layer B + fingerprint + kontras harus tetap hijau
npx tsc --noEmit
```
Tambahan: buka preview (`/portfolio/preview?template=…`) dan bandingkan tiga tema secara visual untuk ketiga section — ini tugas dengan bukti visual, lampirkan deskripsi singkat perbandingan di laporan.

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/sections/AboutSection.tsx src/components/portfolio/sections/ExperienceSection.tsx src/components/portfolio/sections/EducationSection.tsx
git commit -m "feat(portfolio): komposisi asli per tema untuk About, Experience, Education"
```

---

### Task 8: Re-compose section B — Certifications, Organizations, Hobbies (× 3) + pass copy publik

**Files:**
- Modify: `src/components/portfolio/sections/CertificationsSection.tsx`, `OrganizationsSection.tsx`, `HobbiesSection.tsx`
- Modify: semua `src/components/portfolio/sections/*.tsx` (pass copy — hanya string Inggris yang tersisa)
- Modify: `src/__tests__/portfolio-theme-fingerprint.test.ts` (pastikan `PENDING_SECTIONS` tetap/berakhir kosong)

**Interfaces:**
- Sama dengan Task 7.

- [ ] **Step 1: Re-compose ketiga section (pola identik Task 7)**

Perhatian: `HobbiesSection` Glass saat ini chip-cloud — chip bulat berpotensi melanggar `radii.pill`/aturan tema; pastikan tetap lolos Layer A.

- [ ] **Step 2: Pass copy Indonesia di SEMUA section**

`rg -n 'View Work|INTRODUCING|Selected Projects|Nowhere|Read More|Core Competencies|WORK\b' src/components/portfolio/sections/` → nol hasil setelah pass. Cari juga string campur lain dengan membaca tiap file (test boleh ditambah: `it("tanpa string Inggris terdeteksi", …)` dengan daftar kata sasaran — pilih kata yang benar-benar ada, jangan daftar kosong yang selalu lolos).

- [ ] **Step 3: Fingerprint `PENDING_SECTIONS` kosong + verifikasi**

```bash
npm test && npx tsc --noEmit
```
Banding visual 3 tema untuk ketiga section, deskripsi di laporan.

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/sections src/__tests__/
git commit -m "feat(portfolio): re-compose Certifications/Organizations/Hobbies + satu suara copy Indonesia"
```

---

### Task 9: Picker tema — thumbnail nyata + deskripsi per tema

**Files:**
- Modify: `src/app/portfolio/page.tsx` (kartu picker)
- Modify: `src/lib/i18n.tsx` (deskripsi 1 baris per tema, id + en)
- Modify: `src/components/PortfolioSpotlight.tsx` bila memakai mockup sama

**Interfaces:**
- Consumes: `PortfolioDocument` (mode `static`, ukuran mini) atau `TEMPLATE_PREVIEWS` data; `THEMES[id].name`.

- [ ] **Step 1: Tulis test (gagal)**

```ts
  it("kartu picker merender dua tema yang berbeda strukturally, bukan cuma warna", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(join(process.cwd(), "src/app/portfolio/page.tsx"), "utf8");
  // berhenti memakai DOM mockup identik
  expect(src).not.toContain("TEMPLATE_PREVIEWS"); // bila keputusan Anda: render via PortfolioDocument
  expect(src).toContain("theme.descriptionKey"); // kunci deskripsi per kartu
});
```
Sesuaikan assertion dengan keputusan implementasi; inti: dua kartu tema berbeda tidak menghasilkan struktur HTML identik, dan tiap kartu punya deskripsi satu baris.

- [ ] **Step 2: Implementasi**

Ganti mockup JSX identik dengan renderer mini: mount `PortfolioDocument mode="static"` dalam kartu ber-`overflow-hidden` dan tinggi tetap (atau konversi screenshot-style markup per tema bila render penuh terlalu berat — pilih satu, jelaskan di laporan). Tambahkan baris deskripsi satu baris per tema (i18n, contoh nada: Glass "Kaca buram dan bunga cahaya", Brutal "Kotak tajam, bayangan keras", Luxe "Serif besar, ruang lega") dan penanda tema default.

- [ ] **Step 3: Verifikasi + commit**

```bash
npm test && npx tsc --noEmit
git add src/app/portfolio/page.tsx src/lib/i18n.tsx src/components/PortfolioSpotlight.tsx src/__tests__/
git commit -m "feat(portfolio): thumbnail picker dari renderer nyata + deskripsi tema"
```

---

### Task 10: Gate akhir — 4 konsumen identik + suite penuh

**Files:**
- Modify: hanya bila gate menemukan kegagalan

**Interfaces:**
- Verifikasi, tanpa fitur baru.

- [ ] **Step 1: Test penuh + typecheck + lint + build**

```bash
npm test
npx tsc --noEmit
npm run lint -- --no-warn-ignored   # harus 0 error
$env:DATABASE_URL='postgresql://build:build@localhost:5432/build'; $env:AUTH_SECRET='build-only-secret'; $env:DEEPSEEK_API_KEY='build-only-key'; $env:NEXT_PUBLIC_BASE_URL='http://localhost:3000'; npm run build
```

- [ ] **Step 2: Cek konstraint (nol temuan)**

```bash
rg -n 'text-\[(8|9|10|11)px\]' src/components/portfolio src/app/portfolio     # nol
rg -n 'rounded-|shadow-|backdrop-blur|#[0-9a-fA-F]{6}' src/components/portfolio/sections src/components/portfolio/render -g '*.tsx'   # nol (setelah stripAllowlist)
rg -n 'cdnfonts|View Work|INTRODUCING|Selected Projects' src/                  # nol
```

- [ ] **Step 3: Smoke 4 konsumen (server lokal, env .env sudah valid)**

`npm run dev` → untuk `themeId` di `glass|brutal|luxe`: `/portfolio/preview?template=<id>` 200, `/api/portfolio/export?draftId=<id>` menghasilkan HTML dengan font link Google + tanpa `backdrop-filter` yang salah, `/p/<slug>` 200 bila ada data uji (atau n/a). Catat hasil per tema.

- [ ] **Step 4: Commit hasil perbaikan bila ada**

```bash
git add -A && git commit -m "fix(portfolio): perbaikan hasil gate spec 2" # hanya bila ada perubahan
```

---

## Checklist Sesuai Spec

| Bagian spec | Task |
|---|---|
| 1 Token layer | 1, 2, 3 |
| 2 Enforcement (Layer A/B, fingerprint, paritas, switch-case) | 2, 3, 4 |
| 3 Kontras AA | 5 |
| 4 Font + CSP fix | 6 |
| 5 Re-compose 6 section × 3 tema | 7, 8 |
| 6 Copy Indonesia satu suara | 7, 8 |
| 7 Picker thumbnail + deskripsi | 9 |
| Gate akhir / kualitas | 10 |
| Kompatibilitas tanpa migrasi DB | tidak ada task (by design) |

## Di luar cakupan

Tema Minimalist (Spec 2.5) · field konten baru · AI · custom domain · pengurangan
motion batch · `lucide-react`/`framer-motion` (ditolak konsultan).
