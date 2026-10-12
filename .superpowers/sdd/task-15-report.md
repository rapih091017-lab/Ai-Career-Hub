# Task 15 Report — Hapus kode mati dan perbaiki copy nama tema

Commit: `a819bcb` — `chore(portfolio): hapus kode mati dan perbaiki copy nama tema`
Branch: `feature/portfolio-trust` (base `9d79a7a`)

## Hasil verifikasi (perintah + output nyata)

```
npx vitest run src/__tests__/portfolio-dead-code.test.ts
  → Test Files 1 passed (1), Tests 7 passed (7)   [red dulu: 6 gagal, lalu hijau]

npx vitest run
  → Test Files  22 passed (22)
    Tests  387 passed (387)

npx tsc --noEmit
  → exit=0 (tanpa output)

npm run lint
  → lint=0 — "28 problems (0 errors, 28 warnings)" — semua warning `<img>` lama di
    src/components/portfolio/sections/** (file yang tidak disentuh task ini).
```

Reference-proof setelah commit (semua rc=1 = nol kecuali yang ditandai):

```
rg -n 'heroBgUrl|heroCreativeTitle' src/ --glob '!**/portfolio-dead-code.test.ts'  → rc=1 (0 hit)
rg -n 'Modern Slate|Minimal Dark|Modern Blue' src/
  → hanya 3 hit di src/__tests__/portfolio-dead-code.test.ts (assert not.toContain — guard itu sendiri)
rg -n 'html-generators|PORTFOLIO_TEMPLATES|getTemplateStyle' src/ --glob '!**/portfolio-dead-code.test.ts' → rc=1 (0 hit)
rg -n 'from "@/components/portfolio/PublishedPortfolio"' src/ → 0 hit
rg -n 'PublishedPortfolio' src/ → hanya fungsi getPublishedPortfolio / komponen
  PublishedPortfolioPage di src/app/p/[slug]/page.tsx (identitas berbeda, tetap dipakai) +
  guard test
rg -n 'Sertifikat & Penghargaan|Organisasi & Kepanitiaan|Nama Hobi|Deskripsi Kegiatan|
        Nama Sertifikat|Tambah Sertifikat|Tambah Organisasi|Tambah Hobi'
  src/components/portfolio/builder/BuilderEditor.tsx → rc=1 (0 hit, sudah lewat t())
```

## File dihapus (dengan bukti nol referensi)

| File | Bukti |
|---|---|
| `src/components/portfolio-templates/html-generators.ts` (719 baris) | `rg 'html-generators' src/` = 0 sebelum hapus (export `generatePortoPremiumHtml`/`generateColorfulHtml`/`generateModernHtml` tak pernah diimpor) |
| `src/lib/portfolioTemplates.ts` (116 baris) | satu-satunya hit `PORTFOLIO_TEMPLATES`/`getTemplateStyle` ada di dalam file itu sendiri; nol importer |
| `src/components/portfolio/PublishedPortfolio.tsx` (69 baris) | satu-satunya pemakai = 2 file test; halaman publik `src/app/p/[slug]/page.tsx` memakai `PortfolioDocument` langsung. Test dipindah menarget `PortfolioDocument` (permintaan review Task 4); 1 test footer wrapper dihapus (perilaku wrapper, bukan document) |

## File diubah

- `src/components/portfolio-templates/types.ts` — buang `heroBgUrl`, `heroCreativeTitle` dari `PortfolioFormData`.
- `src/lib/portfolio/schema.ts` — buang kedua field + komentar basi "masih dipakai form live builder".
- `src/components/portfolio/render/PortfolioDocument.tsx` — buang 2 baris di `EMPTY_FORM_DATA` (test kesetaraan kunci vs `portfolioFormDataSchema.shape` hijau otomatis karena kedua sisi diubah bersama).
- `src/components/portfolio/builder/BuilderEditor.tsx` — hapus interface lokal, `DEFAULT_FORM`, input "URL Gambar Hero"/"Judul Kreatif", entri `fieldLabels.heroCreativeTitle`; konversi judul+label+ tombol section sertifikat/organisasi/hobi ke `t()` (pakai key `live.form.*` yang sudah ada; hanya `live.form.org-desc` yang baru).
- `src/app/portfolio/build/page.tsx` — hapus 2 baris seed draft kosong.
- `src/lib/i18n.tsx` — hapus key `build.hero-bg-url` & `build.hero-creative` (tak terpakai setelah input dibuang); tambah `features.theme-glass-desc` / `theme-brutal-desc` / `theme-luxe-desc` + `live.form.org-desc`; `build.certifications` → "Sertifikat & Penghargaan", `build.organizations` → "Organisasi & Kepanitiaan" (mempertahankan copy judul accordion lama).
- `src/components/FeatureTabs.tsx` — `PORTFOLIO_THEMES`: id/nama jadi `glass`/Glassmorphism, `brutal`/Neo Brutal, `luxe`/Editorial Luxe; deskripsi per kartu lewat `t(theme.descKey)` (file ini memang memakai `t()`).
- `src/components/PortfolioSpotlight.tsx` — ganti 3 nama tema (nama = proper noun, inline, mengikuti konvensi file yang sudah inline).
- `src/components/portfolio/sectionVisibility.ts` — komentar: `PublishedPortfolio` → `PortfolioDocument mode static`.
- Test: `portfolio-dead-code.test.ts` (baru, 7 test, red→green), `portfolio-schema.test.ts`, `portfolio-document.test.tsx`, `portfolio-ai-map.test.ts`, `portfolio-legacy-migration.test.ts`.

## Deviasi dari brief (brief basi)

1. `generateExportHtml`/edit build page path brief salah — Task 12/14 sudah memindahkannya; `src/components/portfolio/build/page.tsx` tidak ada, yang ada `src/app/portfolio/build/page.tsx`.
2. Brief menghapus field dari `src/components/portfolio-types.ts` — berkas itu tidak ada; tipe hidup di `portfolio-templates/types.ts`.
3. Test brief meng-assert `types.ts` bebas "Sertifikat & Penghargaan" — string itu ada di `BuilderEditor.tsx`, jadi assert dipindah ke BuilderEditor (termasuk label & tombol lain di 3 section).
4. Brief tidak tahu soal `PublishedPortfolio` test-only; sesuai instruksi tambahan, wrapper dihapus dan test dipindah ke `PortfolioDocument`.
5. Test brief "field mati hilang" diperluas ke 5 file (tipe, schema, EMPTY_FORM_DATA, BuilderEditor, build page).
6. Sisa 2 test menyebut nama field mati: hanya di `portfolio-dead-code.test.ts` (assert ketiadaan — must contain the name to check it) dan `portfolio-schema.test.ts` diganti jadi assert generik `kunciTerhapus` di-strip zod (bukti perilaku strip tanpa menyebut nama field). Nol hit di production code.
7. Key i18n `build.certifications`/`build.organizations` nilainya saya perkaya jadi judul lama ("…& Penghargaan", "…& Kepanitiaan") supaya copy tidak hilang; ini juga yang tampil di panel nama section (`SECTION_NAME_KEYS`).

## Concern / catatan untuk Task 16

- **Swatch warna kartu tema di FeatureTabs/PortfolioSpotlight masih warna generik lama** (bukan palet asli `themes.ts`). Nama+deskripsi sudah jujur; warna dekoratif tidak disentuh (di luar scope brief, hindari risiko styling).
- **Deskripsi tema tidak ditambahkan ke PortfolioSpotlight** — tile-nya grid 3 kolom sempit, hanya muat nama; deskripsi hidup di FeatureTabs (tempat kartu memang punya baris deskripsi).
- **`aria-label` hardcoded** ("Hapus sertifikat", dst.) dibiarkan — konsisten dengan section lain (pengalaman/pendidikan juga hardcoded); kalau mau seragam, pindahkan semua section sekaligus.
- **`PortfolioCanvas` drag/dnd tidak disentuh** — `ThemeContext` masih dipakai `PortfolioDocument` + semua `sections/*`; membuktikan nol konsumen untuk drag code terlalu berisiko untuk task ini.
- **Data DB jsonb lama** dengan `heroBgUrl`/`heroCreativeTitle` aman: `portfolioDataSchema` (z.object) me-strip kunci asing saat parse, dan `normalizeData` di `PortfolioDocument` mem-whitelist lewat `FORM_KEYS` — sudah dibuktikan test generik strip.
- Pre-existing: 28 warning lint `<img>` di `sections/*` (bukan dari perubahan ini).
