# Task 1 Report — Token layer di `ThemeDefinition`

Status: DONE_WITH_CONCERNS

## Files changed

- `src/components/portfolio/types.ts` — tambah 5 interface (`ThemeRadii`, `ThemeBlur`, `ThemeShadow`, `ThemeTypography`, `ThemeFocusRing`) + 5 field di `ThemeDefinition` (setelah `colors`, sebelum `sectionColors`); hapus `cssVars: Record<string, string>;`.
- `src/components/portfolio/themes.ts` — isi token untuk glass/brutal/luxe; hapus blok `cssVars` di ketiga tema. `sectionColors`, `previewGradient`, `font*`, `DEFAULT_*`, `TEMPLATE_PREVIEWS` tidak disentuh.
- `src/__tests__/portfolio-theme-rules.test.ts` — baru, kode persis dari brief.

Tidak ada komentar baru yang ditulis (jadi antislop-code checklist nihil perubahan). Tidak ada komponen section yang disentuh.

## Perintah + output nyata

Red (Step 2):

```
npx vitest run src/__tests__/portfolio-theme-rules.test.ts
 ❯ src/__tests__/portfolio-theme-rules.test.ts (4 tests | 3 failed)
     × setiap tema punya token lengkap   → AssertionError: tema glass kehilangan radii: expected undefined to be defined
     × cssVars sudah dihapus dari definisi → expected '…cssVars: Record<string, string>…' not to contain 'cssVars'
     × focusRing tidak lagi memakai teal app → TypeError: Cannot read properties of undefined (reading 'color')
 Test Files  1 failed (1)
      Tests  3 failed | 1 passed (4)     ← 1 passing = test paritas THEME_IDS/THEMES/TEMPLATE_PREVIEWS
```

Green (Step 5):

```
npx vitest run src/__tests__/portfolio-theme-rules.test.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)

npm test
 Test Files  25 passed (25)
      Tests  410 passed (410)            ← 406 lama + 4 baru

npx tsc --noEmit → EXIT=0
npx eslint src/components/portfolio/types.ts src/components/portfolio/themes.ts src/__tests__/portfolio-theme-rules.test.ts → EXIT=0

rg -n cssVars src/
src/__tests__/portfolio-theme-rules.test.ts:23,28,29   ← hanya string guard di test itu sendiri; kode produksi 0 hit
```

## Survey literal (grounding token)

Perintah utama:

```
rg "borderRadius|boxShadow|backdrop-blur|fontFamily" src/components/portfolio/sections/
```

plus bucketing otomatis per komponen tema (`function Glass* / Brutal* / Luxe*` line ranges) untuk `borderRadius|boxShadow|backdropFilter|blur-[|fontFamily|rounded-|<button`.

Hasil kunci per tema:

| Token | glass | bukti literal | brutal | bukti | luxe | bukti |
|---|---|---|---|---|---|---|
| radii.card | 1.5rem | Cert:45, Org:42, Testi:56 | 0.75rem | Cert:122, Edu:143, Hobbies:100, Org:115, Testi:142 | 1.5rem | Edu:228, Skills:165/187/196 |
| radii.button | 9999px | `FancyButton` rounded-full dipakai 3 hero (Hero:17) | 9999px | sama (Hero:350) | 9999px | sama (Hero:508) |
| radii.pill | 9999px | eyebrow/chip `rounded-full` (Hero:47, Skills:39) | 100px | Stats:93 `borderRadius:"100px"` | 9999px | badges `rounded-full`, Hobbies:159 `999px` |
| radii.image | 2rem | frame gambar Hero:253, Projects:48 | 1.25rem | frame Projects:139, Experience:127 | 2rem | frame gambar Hero:527 |
| blur.card | blur(20px) | `backdropFilter:"blur(20px)"` ×8 (Cert:51, Proj:53, …); 30px ×3 (About:46, Contact:44, Stats:52) | "" | tak ada backdropFilter di brutal | "" | tak ada |
| blur.glow | blur(120px) | blob `blur-[120px]` Hero:155, Testi:24 (80px/100px hanya 1×) | "" | tak ada | "" | tak ada |
| shadow.card | inset 0 1px 1px rgba(255,255,255,0.06) | literal identik ×6 (Cert:52, Edu:50, Exp:59, Proj:52, Org:46, Testi:59) | 6px 6px 0 0 currentColor | `6px 6px 0px ${theme.colors.border}` dominan ×5 (Edu:144, Cert:123, Org:116, Testi:143, Skills:119); border==text==#1A1A1A sehingga currentColor setara | inset 0 1px 2px rgba(0,0,0,0.03) | Exp:221, Proj:232 |
| shadow.focus | 0 0 0 3px rgba(167,139,250,0.55) | tak ada literal focus eksisting; warna dari `colors.secondary` glass | 0 0 0 3px #FF3366 | warna dari `colors.primary` | 0 0 0 3px #B8863C | warna dari `colors.primary` |
| typography | Geist ×3 | tak ada `fontFamily` di komponen Glass; `theme.font` dipasang global di PortfolioDocument:364 | Space Grotesk ×3 | tak ada override; global | Playfair/Sora/Sora | h2 Luxe Playfair (About:194), body+eyebrow Sora (Hero:462, span uppercase Sora) |
| focusRing | #A78BFA / 3px | `colors.secondary` | #FF3366 / 3px | `colors.primary` | #B8863C / 3px | `colors.primary` |

Deviasi dari contoh brief (contoh bilang "sesuaikan angka dengan literal yang benar-benar ada"):

- glass blur card 12px (contoh) → **20px** (literal dominan).
- glass radii.image 1.5rem (contoh) → **2rem** (literal frame gambar).
- brutal radii "0 semua" (contoh) → **tidak ada literal 0** di brutal; card 0.75rem, frame 1.25rem, pill 100px.
- brutal focusRing `#D6004F` & luxe `#8A6420` (contoh) → **tidak ada di mana pun di kode**; dipakai warna palet yang ada (`#FF3366`, `#B8863C`). T5 boleh menggelapkan bila kontras gagal.
- luxe shadow.card `none` (contoh) → literal nyata `inset 0 1px 2px rgba(0,0,0,0.03)`; glow luxe `blur(50px)` (contoh) → tidak ada literal blur di luxe, diisi `""`.
- format `blur.card` memakai `"blur(20px)"` (valid untuk `backdropFilter`), bukan `"backdrop-blur(12px)"` dari contoh (bukan fungsi CSS valid).

## Slot token yang ditambahkan

**Tidak ada.** `ThemeRadii` tetap 4 slot. Alasan: tiap tema punya 3–5 radius keluarga kartu (glass 1/1.5/2rem; brutal 0.75/1/1.25/1.5/2rem; luxe 1.25/1.5/2/2.5rem) sehingga menambah satu slot tetap tidak mewakili brutal — slot bersifat peran (card/button/pill/image), bukan dump semua nilai. Sisa literal dinormalisasi ke token saat migrasi Tasks 2–3.

## Self-review

- Diff hanya menyentuh 3 file yang direncanakan; `sectionColors` & `previewGradient` identik dengan sebelumnya.
- Paritas test sudah lulus bahkan saat red (1 passing) — `THEME_IDS` = keys `THEMES` = keys `TEMPLATE_PREVIEWS`.
- `cssVars` di produksi 0 referensi (hanya string guard di test baru).
- `npx tsc --noEmit` bersih; eslint bersih di 3 file.
- `previewGradient` glass masih `"bg-gradient-to-br …"` (bukan masalah, tidak diubah).

## Concerns

1. **Radius keluarga melebihi 4 slot** — Tasks 2–3 harus memilih normalisasi; delta visual ≤0.5rem mungkin muncul (mis. kartu About/Contact glass 1rem → card token 1.5rem; frame brutal 1.5/2rem → image 1.25rem).
2. **`shadow.card` brutal memakai `currentColor`** — setara `theme.colors.border` hanya selama border==text (#1A1A1A); kehilangan reaktivitas bila user mengkustomisasi warna border (lihat `PortfolioDocument` merge warna custom).
3. **Focus ring belum punya literal nyata** di section — `focusRing`/`shadow.focus` adalah desain baru; T5 yang memvalidasi kontras AA.
4. `.superpowers/sdd/task-1-brief.md` sudah termodifikasi di working tree **sebelum** task ini (bukan oleh agent) dan sengaja tidak ikut di-commit.

## Fix wave 1

Commit: `b257fe0` � `fix(portfolio): token signature Brutal radius 0, Luxe tanpa shadow` (files: `themes.ts` + test only; `types.ts` tak berubah).

### What changed

- **Fix 1:** brutal `radii: { card: "0", button: "0", pill: "0", image: "0" }` � sebelumnya `0.75rem/9999px/100px/1.25rem` (hasil survey literal). Signature RULE spec (`docs/superpowers/specs/2026-10-12-portfolio-theme-foundation-design.md:89` "Brutal `radii.* = "0"` seragam") menang atas literal; literal `rounded-*` akan di-scan Task 2-3. Pill brutal jadi siku � by design; `9999px` hanya diperbolehkan sebagai exception markup scan, bukan di token.
- **Fix 2:** luxe `shadow.card: "none"` � sebelumnya `inset 0 1px 2px rgba(0,0,0,0.03)` (literal nyata Exp:221/Proj:232). Spec :90 "Luxe `shadow.card = "none"`" + Layer B `THEMES.luxe.shadow.card === "none"` menang.
- **Fix 3:** signature test baru (red-first) di `portfolio-theme-rules.test.ts`:
  `expect(THEMES.brutal.radii.card/button/pill/image).toBe("0")`, `expect(THEMES.luxe.shadow.card).toBe("none")`, `expect(THEMES.glass.blur.card).toBeTruthy()`.

### Red ? green

```
npx vitest run src/__tests__/portfolio-theme-rules.test.ts   (sebelum fix)
 FAIL � signature tema sesuai spec ? AssertionError: expected '0.75rem' to be '0'
 Test Files  1 failed (1)   Tests  1 failed | 4 passed (5)

npx vitest run src/__tests__/portfolio-theme-rules.test.ts   (sesudah fix)
 Test Files  1 passed (1)   Tests  5 passed (5)
```

### Commands

```
npm test
 Test Files  25 passed (25)
      Tests  411 passed (411)     ? 410 + 1 signature test baru

npx tsc --noEmit ? EXIT=0
```

### Deviation list (audit vs brief)

| # | Deviasi | Verdict |
|---|---|---|
| 1 | brutal radii `0.75rem/9999px/100px/1.25rem` (bukan `"0"` seragam) | **REVERTED** ? `"0"` �4 (signature RULE) |
| 2 | luxe `shadow.card` inset literal (bukan `"none"`) | **REVERTED** ? `"none"` (signature RULE) |
| 3 | glass `blur.card` 12px ? `blur(20px)` | **KEEP** � literal `backdropFilter:"blur(20px)"` �8 (Cert:51, Proj:53, dst.); format `blur(20px)` valid utk `style.backdropFilter`, `backdrop-blur(...)` bukan fungsi CSS |
| 4 | glass `radii.image` 1.5rem ? 2rem | **KEEP** � literal frame gambar Hero:253, Projects:48; bukan signature RULE (hanya `radii = 1rem` terpenuhi) |
| 5 | brutal `focusRing` `#D6004F` ? `#FF3366` | **KEEP** � `colors.primary` brutal, kontras 3.5:1 = 3.0 (spec threshold); T5 recheck |
| 6 | luxe `focusRing` `#8A6420` ? `#B8863C` | **KEEP** � `colors.primary` luxe, kontras 3.1:1 = 3.0; T5 recheck |
| 7 | luxe `blur.glow` `blur(50px)` ? `""` | **KEEP** � nol literal blur di Luxe; bukan signature (signature hanya `shadow.card` & presence glass blur) |
| 8 | glass `shadow.card` inset `rgba(255,255,255,0.06)` (bukan contoh `0 8px 32px�`) | **KEEP** � literal �6; contoh brief bukan RULE |
| 9 | brutal `shadow.card` `6px 6px 0 0 currentColor` | **KEEP** � "shadow.card hard" spec :89 terpenuhi; literal dominan �5 |
| 10 | Slot token tidak ditambah | **KEEP** � brief mewajibkan 4 slot; alasan di �Slot token di atas |

Signature RULE lain dijaga utuh: glass `blur.card` terisi (test), brutal `blur.* = ""`, glass `radii = 1rem`.
