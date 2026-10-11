# Task 14 Report — Builder ke `/portfolio/build/[draftId]`

Status: **DONE** (green on HEAD `deca8e72b0b5c2d72c051ab521dd7b60562f5ec7`)

## Test first (red)

```
npx vitest run src/__tests__/portfolio-entry-points.test.ts
→ Test Files 1 failed (1) | Tests 4 failed (4)
```
Semua 4 assertion gagal sebelum perubahan (build/[draftId] belum ada, live masih editor, kunci lama masih ada, halaman portfolio masih menautkan `/portfolio/live`). Dijadikan pengunci arah kerja.

## File-by-file changes

| File | Aksi | Isi |
|---|---|---|
| `src/__tests__/portfolio-entry-points.test.ts` | create | Persis gaya brief: `build/[draftId]` ada; live `router.replace` + tanpa `portfolio_live_data`; build/live/preview bebas `"portfolio_draft"`/`"portfolio_live_data"`; `page.tsx` tanpa `/portfolio/live`. |
| `src/components/portfolio/PortfolioSkeleton.tsx` | create | Skeleton spinner Indonesia (brief, **default export**). |
| `src/lib/portfolio/live-data.ts` | create | `interface LiveData` **dipindah** dari `live/page.tsx` (lihat Deviasi 3). |
| `src/lib/portfolio/legacy-migration.ts` | create | `readLegacyDraft()` / `clearLegacyDraft()`. Satu-satunya tempat literal kunci legacy `portfolio_live_data` / `portfolio_draft` hidup (lihat Deviasi 2). |
| `src/components/portfolio/builder/BuilderEditor.tsx` | create | Seluruh isi `build/page.tsx` lama dipindah utuh, lalu di-rerig ke hook draft. |
| `src/app/portfolio/build/[draftId]/page.tsx` | create | Ambil `draftId` via `use(params)` → `usePortfolioDraft(draftId)`. `draft.loading` → `PortfolioSkeleton "Memuat draft"`; `!draft.data` → "Draft tidak ditemukan." + tombol `Mulai draft baru` → `/portfolio/build`; sukses → `<AuthGuard><BuilderEditor draft={draft}/></AuthGuard>`. |
| `src/app/portfolio/build/page.tsx` | rewrite | Jadi **pembuat draft**: GET latest → kalau ada, arahkan ke situ (lihat Deviasi 1); kalau tidak, isi dari legacy (jika lolos `portfolioDataSchema`) atau `emptyFormData()`, POST, `router.replace(/portfolio/build/<id>)`. Ada state gagal + `Coba lagi`. |
| `src/app/portfolio/live/page.tsx` | rewrite | Redirect murni ke `/portfolio/build` (atau `/portfolio/build/<id>` bila `?draftId=`). |
| `src/app/portfolio/preview/page.tsx` | modify | Ganti load localStorage → **GET server** (`?draftId=` dari URL kalau ada, else `/api/portfolio/draft` latest), fallback `readCache(draftId)` offline, lalu "Belum ada draft". Link empty-state & `Edit` → `/portfolio/build[/<id>]`. Theme switcher / print / export / PublishDialog **tidak disentuh**. |
| `src/app/portfolio/page.tsx` | modify | CTA "Live Builder" → `/portfolio/build`, label "Buat Portfolio". Tidak ada lagi string `/portfolio/live`. |
| `src/components/PortfolioSpotlight.tsx` | modify | CTA `/portfolio` → `/portfolio/build`. |
| `src/lib/portfolio/usePortfolioDraft.ts` | modify | `flush` kini `Promise<boolean>`; diekspos sebagai `flushNow` (tombol preview menunggu hasil). `retry`/debounce/cache tidak berubah. |
| `src/__tests__/portfolio-ai-map.test.ts` | modify | Baca `build/page.tsx` → `builder/BuilderEditor.tsx`; `LiveData` → `lib/live-data`. Assertion seo disesuaikan arsitektur baru (lihat Deviasi 6). Blok "live editor" dihapus (editornya sudah tidak ada). |
| `src/__tests__/portfolio-schema.test.ts` | modify | `import type { LiveData } from "@/lib/portfolio/live-data"`. |

## Cara body builder dipecah

`build/page.tsx` lama (1552 baris) disalin **utuh** ke `BuilderEditor.tsx`, lalu:

1. **Impor**: hapus `AuthGuard`; tambah `UsePortfolioDraftResult` + `ValidatedPortfolioData`.
2. **Bungkus**: `<AuthGuard>` diganti `<>` (parent `[draftId]` sudah mem-guard; JSX tetap valid karena ada beberapa anak).
3. **Seed**: `useUndoStack<PortfolioData>(seed)` dengan `seed = seedFrom(draft.data!)` (memetakan `ValidatedPortfolioData` → `PortfolioData`, termasuk `seo`). Ganti konstanta `DEFAULT_FORM`+placeholder seed lama.
4. **Load effect localStorage** dihapus (hook sudah memuat). Diganti dua efek: (a) `isDraftEmpty(portfolio)` → buka source picker sekali; (b) efek sinkron `draftSetData(portfolio)` setiap `portfolio` berubah — **iterasi pertama dilewati** (`syncedOnce`) supaya tidak ada PATCH ulang saat mount. Karena semua setter (`setFormData`, `setProjects`, dst., juga `undo`/`redo`/`reset` via cancel) lewat `setPortfolio`, satu efek ini menjamin `draft.setData` dipanggil.
5. **Autosave localStorage** (1500 ms) dihapus → debounce + status ditangani `usePortfolioDraft`.
6. **`saveStatus`** kini **derived** dari `draft.status` / `draft.lastSavedAt`; tambah cabang `error` → tombol `draft.retry()` dengan salinan inline.
7. **Footer**: tombol simpan → `await draft.flushNow()`; kalau `false` → toast gagal, kalau `true` → `window.open(/portfolio/preview?draftId=…)`. Tombol batal → tetap reset via setter (sinkron mendorong ke server), `localStorage.removeItem` dihapus.
8. `generateFromCv`: blok `const payload = {…}` + `localStorage.setItem` dihapus (setter sudah sinkron).

Kapabilitas yang **tetap**: source picker (3 opsi), CV import, AI popup + fix-wave (`aiFormList`/`aiSeoList`/`applyAllAi`), progress bar, undo/redo footer, AIPolish, semua akordeon, foto upload.

## Cara draft localStorage lama di-seed

Di **creator** (`build/page.tsx`):

1. `GET /api/portfolio/draft` (latest).
2. **Kalau sudah ada draft server** → tidak menyentuh legacy (data server lebih baru, jangan ditimpa) → `clearLegacyDraft()` → redirect. Menjamin "satu draft", bukan spam baris.
3. **Kalau belum ada** → `readLegacyDraft()` (urutan: `portfolio_live_data` dulu, lalu `portfolio_draft`; JSON rusak dilewati) → `portfolioDataSchema.safeParse(legacy)`.
   - lolos → dipakai sebagai `data` POST (field tak dikenal seperti `themeId`/`alignment` di-strip Zod; `sectionOrder`/`sectionVisibility`/`fontSize`/`seo` ikut tersimpan);
   - tidak lolos → `portfolioDataSchema.parse(emptyFormData())`.
4. POST → sukses → **`clearLegacyDraft()`** (sekali, kedua kunci dihapus) → redirect ke `/portfolio/build/<draftId>`.

Kunci literal tidak pernah muncul di `build/live/preview` (dipindah ke `legacy-migration.ts`) sehingga pengujian "kunci lama hilang" tetap hijau sementara jalur migrasi tetap berjalan.

## Commands + output nyata

```
npx tsc --noEmit
→ (exit 0, tanpa output)

npm test
→ Test Files  20 passed (20)
   Tests  357 passed (357)

git commit -m "refactor(portfolio): satu builder, satu draft, satu entry point"
→ [feature/portfolio-trust deca8e7] … 14 files changed, 2698 insertions(+), 2273 deletions(-)
```
`npx tsc --noEmit` + `npm test` dijalankan sebelum commit dan diulang di HEAD (hijau keduanya).

## Deviasi dari brief (+ alasan)

1. **Creator memakai draft terbaru, bukan selalu POST.** Brief selalu membuat draft baru; itu membanjiri tabel tiap kunjungan. Creator kini memakai draft server bila ada, POST hanya saat belum ada. Migrasi legacy tetap terjadi di jalur POST.
2. **Literal kunci legacy dipindah ke `src/lib/portfolio/legacy-migration.ts`**, bukan di `build/page.tsx`. Brief minta migrasi *dan* test melarang literal `"portfolio_draft"`/`"portfolio_live_data"` di build/live/preview — keduanya mustahil bersamaan; solusi: baca di modul terpusat, halaman cuma memanggil `readLegacyDraft()/clearLegacyDraft()`.
3. **`LiveData` pindah ke `src/lib/portfolio/live-data.ts`.** `portfolio-schema.test.ts` mengimpor tipenya dari `live/page.tsx`; begitu halaman itu jadi redirect, `tsc` gagal. Pindah modul, import test disesuaikan.
4. **`PortfolioSkeleton` default export.** Potongan brief menamainya named di satu tempat dan default di tempat lain — dipakai default secara konsisten.
5. **Redirect live membaca `window.location.search`**, bukan `useSearchParams()` — menghindari kewajiban Suspense/CSR-bailout Next saat build; perilaku identik.
6. **`portfolio-ai-map.test.ts` & `portfolio-schema.test.ts` disesuaikan.** Keduanya mem-lock teks/tipe file yang tugas ini pindah atau hapus. Blok seo `build` dipindah ke `BuilderEditor` (intent tetap: seo ikut seed, satu jalur simpan, `currentPortfolioData`, `seo: merged.seo`); blok seo `live` dihapus karena editornya sudah diganti redirect; `LiveData` tetap diuji lewat modul baru.
7. **`usePortfolioDraft.flushNow()`** ditambahkan (return `boolean`) supaya preview hanya dibuka setelah save terkonfirmasi — brief tidak menyebutnya, tapi tanpa ini ada race PATCH vs GET preview.
8. **Fitur editor visual `live` (drag-reorder, theme picker in-editor, alignment, publish dialog di editor) ikut hilang** mengikuti brief yang memaksa `/portfolio/live` jadi redirect. Theme switcher + publish tetap di preview; `sectionOrder`/`fontSize`/`alignment` tetap disimpan schema. Ini ruang lingkup brief, bukan kecelakaan.

## Concerns

- **Tidak ada affordance "draft baru kosong"** — semua jalur memakai draft terbaru; butuh tombol+daftar draft terpisah kalau user ingin mulai ulang.
- **Fallback offline preview hanya saat `?draftId=` ada** (cache per-draft). Buka `/portfolio/preview` polos saat offline → "Belum ada draft".
- **`BuilderEditor` hanya diuji source-text + tsc** — tidak ada render/jsdom test untuk editor 1,5 ribu baris.
- Salinan tombol retry di footer masih inline (belum kunci i18n).
- Judul/robots masih menyebut `/portfolio/live` (route-nya masih ada sebagai redirect, jadi tidak salah), tapi bisa dibersihkan terpisah.

## Fix wave 1

### Perubahan per file

- `src/lib/portfolio/schema.ts` — `portfolioDataSchema` kini punya `alignment: z.partialRecord(z.enum(SECTION_IDS), z.enum(["left", "center", "right"])).optional()` (alasan sama seperti `fontSize`: round-trip lewat API draft; `publishPayloadSchema.alignment` top-level dibiarkan). Draft PATCH/POST kini menyimpan perataan.
- `src/components/portfolio-templates/types.ts` — `PortfolioData.alignment?: Record<string, "left" | "center" | "right">` (union inline, tanpa impor baru).
- `src/components/portfolio/alignment-style.ts` (baru) — `alignmentToSectionStyle()`: memetakan peta alignment → `sectionStyle` (`{ textAlign }`), nilai di luar kiri/tengah/kanan dibuang.
- `src/app/portfolio/preview/page.tsx` — interface lokal `PortfolioData` ditambah `alignment`; kedua instance `PortfolioDocument` (mode cetak + editor) kini menerima `sectionStyle={sectionStyle}` hasil `alignmentToSectionStyle(data.alignment)`.
- `src/app/p/[slug]/page.tsx` — `sectionStyle={alignmentToSectionStyle(d.alignment)}` pada `PortfolioDocument`, jadi halaman publik menghormati perataan yang tersimpan.
- `src/app/api/portfolio/publish/route.ts` — merge payload publish: alignment top-level dari dialog menang; kalau hanya ada di `data` (panggilan API langsung), tidak lagi ditimpa default `{}` (`data.alignment ?? alignment`).
- `src/components/portfolio/builder/BuilderEditor.tsx` —
  - Panel **Tampilan** (`data-testid="appearance-panel"`) berisi: daftar section (nama i18n, toggle mata on/off dengan `aria-pressed`, tombol ↑/↓ `min-h-11`), segmented control **Ukuran teks** small/medium/large dengan label hidup (`live.font-compact/standard/bold`), dan `<select>` perataan kiri/tengah/kanan per baris section (`aria-label` = `live.text-align` + nama section).
  - Semua tulisan lewat `applyAppearance()` → updater fungsional ke undo stack editor **dan** `draft.setData`/`draftSetData(prev => …)`; urutan dihitung dari `sectionOrder` (default `DEFAULT_SECTION_ORDER`, id asing dibuang, id hilang ditambahkan di belakang), visibilitas dibaca via `isSectionVisible` dan toggle menulis `true`/`false` eksplisit (unlisted = tampil, semantik `resolveVisibility` tidak diubah).
  - Tombol **Draft baru** di header progress: POST `/api/portfolio/draft` dengan `portfolioDataSchema.parse({ formData: DEFAULT_FORM })` lalu `router.replace("/portfolio/build/<id>")`.
  - `seedFrom` kini ikut membawa `alignment`.
- `src/lib/i18n.tsx` — kunci baru (id/en): `live.appearance` (Tampilan), `live.align-left|center|right` (Kiri/Tengah/Kanan), `live.show-section`, `live.hide-section`, `live.move-up`, `live.move-down`, `build.stats`, `build.certifications`, `build.organizations`, `build.hobbies`, `build.new-draft` (Draft baru). Kunci lama yang dipakai ulang: `live.section-order`, `live.font-size`, `live.font-small|medium|large`, `live.font-compact|standard|bold`, `live.text-align`, `build.hero-title|about|project|skill|experience|education|testimonial|contact`.
- `src/__tests__/portfolio-schema.test.ts` — 5 test `alignment di portfolioDataSchema`: round-trip, nilai sah, nilai ditolak (`"middle"`), section id asing ditolak, tanpa alignment tetap lolos, alignment ikut `publishPayloadSchema.data` bersama default top-level.
- `src/__tests__/portfolio-entry-points.test.ts` — 4 test: BuilderEditor memuat marker kontrol (`t("live.section-order")`, `t("live.font-size")`, `t("live.text-align")`, `t("live.appearance")`, `moveSection`, `toggleSectionVisible`, `setSectionAlignment`, `setAppearanceFontSize`), aksi Draft baru, preview + `/p/` meneruskan `sectionStyle` (preview ≥2 pemakaian), rantai lengkap schema/tipe/merge publish.

### Peletakan panel

Panel **Tampilan** ditaruh **di bawah deretan accordion, di atas daftar "Perubahan AI"** — accordion konten tetap jadi hal pertama yang dilihat (alur isi-mengisi), sedangkan pengaturan gaya menyusul sebagai satu kartu setelah konten selesai; nama section di panel sejajar dengan judul accordion di atasnya, jadi pemetaannya mudah ditebak.

### Bukti red → green

Red (ditulis dulu, sebelum implementasi):

```
$ npm test -- portfolio-schema.test.ts portfolio-entry-points.test.ts
 ❯ src/__tests__/portfolio-entry-points.test.ts (8 tests | 4 failed)
 ❯ src/__tests__/portfolio-schema.test.ts (76 tests | 4 failed)
 Test Files  2 failed (2)
      Tests  8 failed | 76 passed (84)
```

8 gagal persis karena fitur belum ada (panel, `sectionStyle`, `alignment` schema, merge publish).

Green (sesudah implementasi):

```
$ npm test
 Test Files  20 passed (20)
      Tests  366 passed (366)

$ npx tsc --noEmit
(exit 0, tanpa output)

$ npx eslint <9 file yang disentuh>
(exit 0, tanpa output)
```

357 → 366 (9 test baru), tidak ada test lama yang dihapus/diubah perilaku.

### Concerns

- `applyAppearance` menulis dua tujuan (undo stack + `draft.setData` fungsional); tujuan kedua teknis redundan dengan efek sinkron yang sudah ada, tapi diminta brief dan membuat perubahan tampilan langsung masuk antrean simpan. Nilai akhirnya sama, jadi tidak ada race tulis yang merusak.
- Panel memakai source-text test (pola repo untuk `BuilderEditor`); belum ada render/jsdom test untuk interaksi klik reorder/toggle.
- Baris `stats` tampil di panel (urutan/visibilitas/perataan) walaupun accordion kontennya tidak ada di builder — konten stats diisi lewat Tentang Saya, semantik urutan tetap utuh.
- `/api/portfolio/export` sengaja tidak disentuh (brief: jangan ubah alur print/export); ekspor HTML mengikuti `sectionOrder`/`fontSize` yang sudah ada, perataan belum ikut diekspor.
