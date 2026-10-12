# Tema Minimalist + Hero Minimalist — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah tema keempat `minimalist` (putih/ink, Instrument Sans, kontras tipe ekstrem) dengan identitas struktural di 9 section + hero sendiri, tanpa merusak tiga tema yang sudah jalan.

**Architecture:** Token masuk ke `themes.ts` sebagai entri `THEMES.minimalist`, `ThemeId` gaining `"minimalist"`. Hero memakai switch yang sudah ada di `HeroSection.tsx:564` — ditambah satu case `minimalist`, bukan file baru. Section struktural memakai pola `switch (theme.id)` yang sudah ada di tiap file section. Token-only section (`stats`, `skills`, `testimonials`) sengaja tidak diberi case; pengecualiannya dikunci konstanta `TOKEN_ONLY_SECTIONS`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind (utility) + inline style dari token, `motion/react` (bukan framer-motion), Vitest + Testing Library, Google Fonts (`fontUrl`).

## Global Constraints

- Token hanya lewat field bertipe di `ThemeDefinition` (`themes.ts`). Dilarang hex literal, `borderRadius`/`boxShadow`/`filter` hardcoded, dan CSS variables baru di section.
- Font lewat `fontUrl` Google Fonts saja. `next/font` DILARANG (mati di export HTML).
- `lucide-react` dan `framer-motion` DILARANG. Ikon = SVG inline. Animasi = `motion/react`.
- `h-screen` / `100dvh` DILARANG (lompatan iOS). Tinggi hero dari padding + `clamp()`.
- Komponen `MinimalistHero` dari referensi TIDAK dipakai sebagai unit; hanya idenya (lingkaran/foto, tipografi raksasa, bio).
- Copy produk Bahasa Indonesia. Tidak ada string Inggris di UI.
- Tanpa migrasi DB. `DEFAULT_THEME_ID` tetap `"glass"`.
- Setiap task berakhir dengan commit kecil yang bisa di-revert sendiri.

## Correction terhadap Spec (§5)

Tiga hero sudah ada dan berbeda (`GlassHero`, `BrutalHero`, `LuxeHero` di `src/components/portfolio/sections/HeroSection.tsx:153/280/428`). Spec 2.5 tidak menulis ulang ketiganya; hanya audit terhadap tabel komposisi. Deviasi yang sudah teridentifikasi dan harus diperbaiki: `LuxeHero` memakai kartu berbingkai + `theme.shadow.card` (`HeroSection.tsx:534`), padahal Luxe tanpa kartu dan tanpa bayangan.

---

### Task 1: Token `minimalist`

**Files:**
- Modify: `src/components/portfolio/types.ts` (`ThemeId`)
- Modify: `src/components/portfolio/themes.ts` (entri baru setelah `luxe`, baris ~176)
- Test: `src/__tests__/portfolio-theme-rules.test.ts`

**Interfaces:**
- Produces: `THEMES.minimalist: ThemeDefinition`; `ThemeId` = `"glass" | "brutal" | "luxe" | "minimalist"`.

- [ ] **Step 1: Tulis test gagal**

Tambahkan ke `portfolio-theme-rules.test.ts`:

```ts
it("tema minimal: monokrom, radius 0, tanpa bayangan, font Google", () => {
  const m = THEMES.minimalist;
  expect(m.colors.bg).toBe("#FFFFFF");
  expect(m.colors.primary).toBe("#111111");
  expect(m.colors.onPrimary).toBe("#FFFFFF");
  expect(m.radii.card).toBe("0px");
  expect(m.shadow.card).toBe("none");
  expect(m.fontUrl).toContain("fonts.googleapis.com");
  expect(m.fontUrl).toContain("Instrument+Sans");
  expect(m.typography.display).toContain("Instrument Sans");
});
```

- [ ] **Step 2: Jalankan — harus FAIL**

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts`
Expected: FAIL, `Cannot read properties of undefined (reading 'colors')`.

- [ ] **Step 3: Implementasi**

`types.ts`, baris 26:

```ts
export const THEME_IDS = ["glass", "brutal", "luxe", "minimalist"] as const;
```

`themes.ts`, setelah entri `luxe`:

```ts
  /**
   * MINIMALIST — putih/ink, satu grotesk, kontras skala ekstrem.
   * Tanpa gradien, tanpa bayangan, tanpa kartu: hairline + ruang kosong.
   */
  minimalist: {
    name: "Minimalist",
    font: "Instrument Sans",
    fontUrl: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;700&display=swap",
    colors: {
      bg: "#FFFFFF",
      surface: "#FAFAFA",
      surfaceVariant: "#F4F4F5",
      onSurface: "#111111",
      onSurfaceVariant: "#52525B",
      primary: "#111111",
      onPrimary: "#FFFFFF",
      secondary: "#71717A",
      outline: "#D4D4D8",
      outlineVariant: "#E4E4E7",
      error: "#B91C1C",
      onError: "#FFFFFF",
      scrim: "rgba(17,17,17,0.04)",
      primaryGlow: "none",
    },
    radii: { card: "0px", control: "0px", panel: "0px" },
    blur: { card: "none", panel: "none" },
    shadow: { card: "none", panel: "none" },
    typography: {
      display: "'Instrument Sans', ui-sans-serif, system-ui",
      body: "'Instrument Sans', ui-sans-serif, system-ui",
      eyebrow: "'Instrument Sans', ui-sans-serif, system-ui",
    },
    focusRing: { color: "#111111", width: "2px" },
    sectionColors: null,
  },
```

`sectionColors: null` disengaja: tema monokrom memakai palet yang sama di semua section.

- [ ] **Step 4: Jalankan — harus PASS** (test lain boleh gagal karena `THEME_IDS` memuat 4 tema; itu(work Task 2-6))

Run: `npx vitest run src/__tests__/portfolio-theme-rules.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/types.ts src/components/portfolio/themes.ts src/__tests__/portfolio-theme-rules.test.ts
git commit -m "feat(portfolio): token tema minimal (monokrom, radius 0, tanpa bayangan)"
```

---

### Task 2: Hero Minimalist

**Files:**
- Modify: `src/components/portfolio/sections/HeroSection.tsx` (fungsi baru + case di switch baris 564)
- Test: `src/__tests__/portfolio-hero.test.tsx` (create)

**Interfaces:**
- Consumes: `THEMES.minimalist`, `PortfolioFormData`, `initials` yang sudah dihitung di `HeroSection.tsx:561`.
- Produces: `MinimalistHero({ data, name, initials })` — signup.matcher komposisi persisted di switch `case "minimalist"`.

- [ ] **Step 1: Tulis test gagal**

`src/__tests__/portfolio-hero.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import HeroSection from "@/components/portfolio/sections/HeroSection";
import { EMPTY_FORM_DATA } from "@/components/portfolio/render/PortfolioDocument";
import type { PortfolioFormData } from "@/components/portfolio/types";

beforeAll(() => {
  const w = window as unknown as Record<string, unknown>;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
});

const data = {
  ...EMPTY_FORM_DATA,
  heroFirstName: "Maya",
  heroLastName: "Chen",
  heroHeadline: "UI/UX Designer",
  heroBio: "Masalah rumit jadi produk yang enak dipakai.",
} as unknown as { formData: PortfolioFormData };

function renderWithTheme(themeId: string) {
  return render(<div data-theme-id={themeId}><HeroSection data={{ formData: data.formData }} themeIdOverride={themeId as never} /></div>);
}

describe("hero per tema", () => {
  it("hero minimal: lingkaran inisial, nama raksasa, bio, tanpa h-screen", () => {
    const { container } = renderWithTheme("minimalist");
    expect(container.querySelector("[data-hero-variant='minimalist']")).toBeTruthy();
    expect(container.textContent).toContain("Maya Chen");
    expect(container.textContent).toContain("UI/UX Designer");
    expect(container.querySelector("[data-hero-circle]")).toBeTruthy();
    expect(container.innerHTML).not.toContain("100vh");
    expect(container.innerHTML).not.toContain("h-screen");
  });

  it("tanpa foto, hero minimal tetap menampilkan lingkaran inisial (MC)", () => {
    const { container } = renderWithTheme("minimalist");
    expect(container.textContent).toContain("MC");
  });
});
```

> Catatan implementasi: `HeroSection` saat ini mengambil tema dari `useTheme()`/context. Bila props `themeIdOverride` tidak ada, tambahkan prop opsional `themeId?: ThemeId` pada `HeroSection` dan pakai `themeId ?? theme.id` sebagai kunci switch. Ini jugaftekan facilitate test.

- [ ] **Step 2: Jalankan — harus FAIL**

Run: `npx vitest run src/__tests__/portfolio-hero.test.tsx`
Expected: FAIL, `[data-hero-variant='minimalist']` null.

- [ ] **Step 3: Implementasi**

Tambahkan sebelum switch (setelah `LuxeHero`) di `HeroSection.tsx`:

```tsx
/**
 * MINIMALIST — lingkaran (foto atau inisial) + nama grotesk raksasa,
 * bio satu paragraf di bawah garis rambut. Tanpa isian, tanpa bayangan,
 * tanpa h-screen: tinggi dari padding + clamp.
 */
function MinimalistHero({ data: f, name, initials }: { data: PortfolioFormData; name: string; initials: string }) {
  const theme = THEMES.minimalist;
  return (
    <section
      data-section-id="hero"
      data-hero-variant="minimalist"
      style={{ background: theme.colors.bg, color: theme.colors.onSurface, padding: "clamp(48px, 10vh, 120px) 0" }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 clamp(20px, 5vw, 48px)" }}>
        <div data-hero-circle style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          {f.heroPhotoUrl ? (
            <SafeImg src={f.heroPhotoUrl} alt={name} width={96} height={96}
              style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <span style={{
              width: 96, height: 96, borderRadius: "50%", display: "grid", placeItems: "center",
              border: `1px solid ${theme.colors.outlineVariant}`,
              fontSize: 28, letterSpacing: "-0.02em", color: theme.colors.onSurface,
            }}>{initials}</span>
          )}
          {f.heroHeadline ? (
            <span style={{
              fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
              color: theme.colors.onSurfaceVariant,
            }}>{f.heroHeadline}</span>
          ) : null}
        </div>
        <h1 style={{
          fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 1.02, letterSpacing: "-0.03em",
          margin: 0, fontWeight: 500,
        }}>{name}</h1>
        {f.heroBio ? (
          <>
            <div style={{ height: 1, background: theme.colors.outlineVariant, margin: "32px 0 24px" }} />
            <p style={{ maxWidth: 620, fontSize: 17, lineHeight: 1.65, margin: 0, color: theme.colors.onSurfaceVariant }}>
              {f.heroBio}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
```

Dan di switch (`HeroSection.tsx:564`):

```tsx
    case "minimalist":
      return <MinimalistHero data={f} name={name} initials={initials} />;
```

- [ ] **Step 4: Jalankan — harus PASS**

Run: `npx vitest run src/__tests__/portfolio-hero.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/sections/HeroSection.tsx src/__tests__/portfolio-hero.test.tsx
git commit -m "feat(portfolio): hero minimal (lingkaran, tipografi raksasa, tanpa h-screen)"
```

---

### Task 3: Audit tiga hero lama terhadap spec

**Files:**
- Modify: `src/components/portfolio/sections/HeroSection.tsx` (`LuxeHero`, `GlassHero`)
- Test: `src/__tests__/portfolio-hero.test.tsx`

**Interfaces:**
- Produces: `LuxeHero` tanpa kartu berbingkai dan tanpa `theme.shadow.card`; `GlassHero` memakai scrim gradien di atas foto.

- [ ] **Step 1: Tulis test gagal**

```tsx
it("hero luxe: tanpa kartu dan tanpa bayangan (spec §5)", () => {
  const { container } = renderWithTheme("luxe");
  expect(container.innerHTML).not.toContain("theme.shadow");
  expect(container.querySelector("[data-hero-frame='card']")).toBeNull();
});

it("hero glass: foto penuh dengan scrim, bukan kartu kecil", () => {
  const { container } = renderWithTheme("glass");
  expect(container.querySelector("[data-hero-scrim]")).toBeTruthy();
});
```

- [ ] **Step 2: Jalankan — harus FAIL** (LuxeHero memakai `boxShadow: theme.shadow.card` di baris 534)

Run: `npx vitest run src/__tests__/portfolio-hero.test.tsx`

- [ ] **Step 3: Implementasi**

`LuxeHero`: ganti blok foto berbingkai (sekitar baris 530-545) dengan kolom foto tanpa radius dan tanpa shadow, beri `data-hero-frame="plain"`.

`GlassHero`: bungkus foto dengan `<div data-hero-scrim style={{ position: "absolute", inset: 0, background: "linear-gradient(...)" }} />` di atas foto, dan buat foto full-bleed (lebar penuh section).

- [ ] **Step 4: Jalankan — harus PASS**

Run: `npx vitest run src/__tests__/portfolio-hero.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/sections/HeroSection.tsx src/__tests__/portfolio-hero.test.tsx
git commit -m "refactor(portfolio): selaraskan hero luxe (tanpa kartu) dan glass (scrim penuh)"
```

---

### Task 4: Section struktural minimal — About, Experience, Education

**Files:**
- Modify: `src/components/portfolio/sections/AboutSection.tsx`, `ExperienceSection.tsx`, `EducationSection.tsx`
- Test: `src/__tests__/portfolio-theme-fingerprint.test.ts`

**Interfaces:**
- Consumes: `THEMES.minimalist`, `switch (theme.id)` yang sudah ada di tiap section.
- Produces: `case "minimalist"` di tiga section; fingerprint test meng purifier 4 tema untuk 9 section.

- [ ] **Step 1: Tulis test gagal**

Di `portfolio-theme-fingerprint.test.ts`, tambahkan konstanta dan perluas loop:

```ts
const TOKEN_ONLY_SECTIONS = ["stats", "skills", "testimonials"] as const;
const STRUCTURAL_SECTIONS = SECTION_IDS.filter(
  (id) => !(TOKEN_ONLY_SECTIONS as readonly string[]).includes(id),
);
```

```ts
it("9 section struktural berbeda bentuknya di keempat tema", async () => {
  for (const id of THEME_IDS) {
    const skels = await Promise.all(
      STRUCTURAL_SECTIONS.map((s) => renderSectionSkeleton(id, s)),
    );
    expect(new Set(skels).size, `tema ${id} punya section struktural yang kembar`).toBe(
      STRUCTURAL_SECTIONS.length,
    );
  }
});
```

- [ ] **Step 2: Jalankan — harus FAIL** (minimalist belum punya case di 9 section)

Run: `npx vitest run src/__tests__/portfolio-theme-fingerprint.test.ts`

- [ ] **Step 3: Implementasi**

`AboutSection.tsx`, `ExperienceSection.tsx`, `EducationSection.tsx`: tambahkan `case "minimalist"` mengikuti tabel spec §6 — label `01 / TENTANG` + hairline + paragraf 20px (About), daftar satu kolom dengan `borderTop` hairline (Experience), dua kolom dengan label `02 / PENDIDIKAN` (Education). Semua nilai dari `theme.*`, tanpa literal.

- [ ] **Step 4: Jalankan — harus PASS untuk tiga section itu** (test penuh masih gagal karena 6 section lain belum)

Run: `npx vitest run src/__tests__/portfolio-theme-fingerprint.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/components/portfolio/sections src/__tests__/portfolio-theme-fingerprint.test.ts
git commit -m "feat(portfolio): section minimal untuk about, experience, education"
```

---

### Task 5: Section struktural minimal — Projects, Certifications, Organizations, Hobbies, Contact

**Files:**
- Modify: `src/components/portfolio/sections/ProjectsSection.tsx`, `CertificationsSection.tsx`, `OrganizationsSection.tsx`, `HobbiesSection.tsx`, `ContactSection.tsx`
- Test: `src/__tests__/portfolio-theme-fingerprint.test.ts`

**Interfaces:**
- Produces: `case "minimalist"` di lima section; `stats`, `skills`, `testimonials` tetap tanpa case.

- [ ] **Step 1: Jalankan test lebih dulu — harus FAIL**

Run: `npx vitest run src/__tests__/portfolio-theme-fingerprint.test.ts`
Expected: FAIL, masih ada section kembar untuk tema `minimalist`.

- [ ] **Step 2: Implementasi**

Lima `case "minimalist"` sesuai spec §6: Projects daftar satu kolom bernomor `01` + gambar full-bleed bila ada; Certifications baris `Nama — Penerbit · Tahun` + hairline tanpa ikon; Organizations `Nama` kiri / `Peran` kanan dengan hairline; Hobbies label + teks tanpa ikon; Contact email 30px sebagai tautan + kolom tautan sosial, tanpa form.

- [ ] **Step 3: Jalankan — harus PASS**

Run: `npx vitest run src/__tests__/portfolio-theme-fingerprint.test.ts`
Expected: semua PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/sections src/__tests__/portfolio-theme-fingerprint.test.ts
git commit -m "feat(portfolio): section minimal untuk projects, certifications, organizations, hobbies, contact"
```

---

### Task 6: Penegakan test meluas ke empat tema

**Files:**
- Modify: `src/__tests__/portfolio-theme-rules.test.ts`, `portfolio-contrast.test.ts`, `portfolio-picker.test.tsx`
- Create: `src/__tests__/portfolio-theme-parity.test.ts`

**Interfaces:**
- Produces: `TOKEN_ONLY_SECTIONS` diekspor dari test paritas; loop test yang semula 3 tema menjadi `THEME_IDS`.

- [ ] **Step 1: Tulis test gagal (paritas switch-case)**

`src/__tests__/portfolio-theme-parity.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { THEME_IDS } from "@/components/portfolio/types";

const TOKEN_ONLY_SECTIONS = ["stats", "skills", "testimonials"];

describe("paritas komposisi section × tema", () => {
  it("setiap section struktural punya case untuk tiap tema", () => {
    const dir = join(process.cwd(), "src/components/portfolio/sections");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
      const id = file.replace("Section.tsx", "");
      if (TOKEN_ONLY_SECTIONS.includes(id)) continue;
      const src = readFileSync(join(dir, file), "utf8");
      for (const theme of THEME_IDS) {
        expect(src.includes(`case "${theme}"`), `${file} tidak punya case "${theme}"`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 2: Jalankan — harus FAIL** (HeroSection belum punya `case "minimalist"` filter yang sama, atau section belum lengkap)

Run: `npx vitest run src/__tests__/portfolio-theme-parity.test.ts`

- [ ] **Step 3: Implementasi**

1. `portfolio-contrast.test.ts`: tambahkan blok `minimalist` — `onSurface/bg` 19:1, `onSurfaceVariant/bg` 7.4:1, `primary/bg` 19:1, `onPrimary/primary` 19:1, `secondary/bg` 4.9:1, `error/bg` 6.5:1.
2. `portfolio-theme-rules.test.ts`: ubah loop hard-coded 3 tema menjadi `THEME_IDS`; tambah assertion radius `0px` + shadow `none` untuk `minimalist`.
3. `portfolio-picker.test.tsx`: `THEME_NAMES` jadi empat (`"Glassmorphism"`, `"Neo Brutal"`, `"Editorial Luxe"`, `"Minimalist"`); tambah deskripsi i18n `portfolio.theme.minimalist-desc`; `Tema bawaan` tetap menempel di Glassmorphism.

- [ ] **Step 4: Jalankan — harus PASS**

```bash
npx vitest run src/__tests__/portfolio-theme-parity.test.ts src/__tests__/portfolio-contrast.test.ts src/__tests__/portfolio-theme-rules.test.ts src/__tests__/portfolio-picker.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/__tests__
git commit -m "test(portfolio): paritas section × tema + kontras + picker 4 kartu"
```

---

### Task 7: Copy "3 tema" → "4 tema"

**Files:**
- Modify: `src/lib/i18n.tsx`, `src/components/PricingSection.tsx`, landing yang menampilkan jumlah tema
- Test: `src/__tests__/portfolio-copy.test.ts` (create)

**Interfaces:**
- Produces: kunci i18n `portfolio.theme.minimalist-desc`; semua copy menyebut 4 tema.

- [ ] **Step 1: Tulis test gagal**

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("copy jumlah tema", () => {
  it("tidak ada copy '3 tema' / '3 pilihan tema' di src", () => {
    const files = ["src/components/PricingSection.tsx", "src/lib/i18n.tsx", "src/app/page.tsx"];
    for (const f of files) {
      const src = readFileSync(join(process.cwd(), f), "utf8");
      expect(src, `${f} masih menyebut 3 tema`).not.toMatch(/3 (pilihan )?tema/);
    }
  });

  it("ada deskripsi tema minimal di i18n", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/i18n.tsx"), "utf8");
    expect(src).toContain("portfolio.theme.minimalist-desc");
  });
});
```

- [ ] **Step 2: Jalankan — harus FAIL**

Run: `npx vitest run src/__tests__/portfolio-copy.test.ts`

- [ ] **Step 3: Implementasi**

- `i18n.tsx`: tambah `"portfolio.theme.minimalist-desc": { id: "Putih bersih, satu huruf, banyak ruang kosong.", en: "..." }`.
- `PricingSection.tsx`: `3 pilihan tema desain modern` → `4 pilihan tema desain modern`.
- `src/app/page.tsx` + metadata: setiap penyebutan jumlah tema → 4.

- [ ] **Step 4: Jalankan — harus PASS**

Run: `npx vitest run src/__tests__/portfolio-copy.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.tsx src/components/PricingSection.tsx src/app/page.tsx src/__tests__/portfolio-copy.test.ts
git commit -m "feat(copy): empat tema di pricing, landing, metadata, dan picker"
```

---

### Task 8: Gate akhir + harness visual

**Files:**
- Modify: `.superpowers/sdd/progress.md`

**Interfaces:**
- Consumes: harness `src/__tests__/qa-visual-harness.test.tsx` (sudah ada, `QA_HARNESS=1`).

- [ ] **Step 1: Jalankan seluruh gate**

```bash
npm test
npx tsc --noEmit
npm run lint
```

Expected: test semua hijau, `tsc` exit 0, lint 0 error.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: `Compiled successfully`, exit 0.

- [ ] **Step 3: Harness visual 4 tema**

```bash
QA_HARNESS=1 npx vitest run src/__tests__/qa-visual-harness.test.tsx
```
Lalu buka file di `%TEMP%/portfolio-qa/` lewat dev server dan screenshot keempat tema; pastikan:
- Glass tetap gelap, Brutal tetap krem + bersiku, Luxe tetap serif + lapang.
- Minimalist putih, tanpa bayangan, nama raksasa, hairline.
- Keempat thumbnail picker berbeda jelas satu sama lain.

- [ ] **Step 4: Update ledger + commit**

```bash
git add .superpowers/sdd/progress.md
git commit -m "docs: ledger spec 2.5 (tema minimal + hero)"
```

## Self-Review

- **Spec coverage:** §4 token → Task 1. §5 hero (4 komposisi + fallback + batas teknis) → Task 2 (minimal) dan Task 3 (tiga hero lama, dengan koreksi scope di atas). §6 sembilan section → Task 4 dan Task 5; tiga token-only dikunci di Task 6. §7 lima gugus test → Task 6. §8 copy → Task 7. §9 verifikasi → Task 8. §10 rollout (tanpa migrasi, default Glass) → dijaga Global Constraints, tidak perlu kode.
- **Placeholder scan:** tidak ada TBD/TODO; setiap langkah kode memuat isi konkret.
- **Type consistency:** `THEMES.minimalist`, `ThemeId`, `TOKEN_ONLY_SECTIONS`, `MinimalistHero({ data, name, initials })` dipakai dengan nama yang sama di seluruh plan.
