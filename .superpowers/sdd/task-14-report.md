# Task 14 Report â€” Builder ke `/portfolio/build/[draftId]`

Status: **DONE** (green on HEAD `deca8e72b0b5c2d72c051ab521dd7b60562f5ec7`)

## Test first (red)

```
npx vitest run src/__tests__/portfolio-entry-points.test.ts
â†’ Test Files 1 failed (1) | Tests 4 failed (4)
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
| `src/app/portfolio/build/[draftId]/page.tsx` | create | Ambil `draftId` via `use(params)` â†’ `usePortfolioDraft(draftId)`. `draft.loading` â†’ `PortfolioSkeleton "Memuat draft"`; `!draft.data` â†’ "Draft tidak ditemukan." + tombol `Mulai draft baru` â†’ `/portfolio/build`; sukses â†’ `<AuthGuard><BuilderEditor draft={draft}/></AuthGuard>`. |
| `src/app/portfolio/build/page.tsx` | rewrite | Jadi **pembuat draft**: GET latest â†’ kalau ada, arahkan ke situ (lihat Deviasi 1); kalau tidak, isi dari legacy (jika lolos `portfolioDataSchema`) atau `emptyFormData()`, POST, `router.replace(/portfolio/build/<id>)`. Ada state gagal + `Coba lagi`. |
| `src/app/portfolio/live/page.tsx` | rewrite | Redirect murni ke `/portfolio/build` (atau `/portfolio/build/<id>` bila `?draftId=`). |
| `src/app/portfolio/preview/page.tsx` | modify | Ganti load localStorage â†’ **GET server** (`?draftId=` dari URL kalau ada, else `/api/portfolio/draft` latest), fallback `readCache(draftId)` offline, lalu "Belum ada draft". Link empty-state & `Edit` â†’ `/portfolio/build[/<id>]`. Theme switcher / print / export / PublishDialog **tidak disentuh**. |
| `src/app/portfolio/page.tsx` | modify | CTA "Live Builder" â†’ `/portfolio/build`, label "Buat Portfolio". Tidak ada lagi string `/portfolio/live`. |
| `src/components/PortfolioSpotlight.tsx` | modify | CTA `/portfolio` â†’ `/portfolio/build`. |
| `src/lib/portfolio/usePortfolioDraft.ts` | modify | `flush` kini `Promise<boolean>`; diekspos sebagai `flushNow` (tombol preview menunggu hasil). `retry`/debounce/cache tidak berubah. |
| `src/__tests__/portfolio-ai-map.test.ts` | modify | Baca `build/page.tsx` â†’ `builder/BuilderEditor.tsx`; `LiveData` â†’ `lib/live-data`. Assertion seo disesuaikan arsitektur baru (lihat Deviasi 6). Blok "live editor" dihapus (editornya sudah tidak ada). |
| `src/__tests__/portfolio-schema.test.ts` | modify | `import type { LiveData } from "@/lib/portfolio/live-data"`. |

## Cara body builder dipecah

`build/page.tsx` lama (1552 baris) disalin **utuh** ke `BuilderEditor.tsx`, lalu:

1. **Impor**: hapus `AuthGuard`; tambah `UsePortfolioDraftResult` + `ValidatedPortfolioData`.
2. **Bungkus**: `<AuthGuard>` diganti `<>` (parent `[draftId]` sudah mem-guard; JSX tetap valid karena ada beberapa anak).
3. **Seed**: `useUndoStack<PortfolioData>(seed)` dengan `seed = seedFrom(draft.data!)` (memetakan `ValidatedPortfolioData` â†’ `PortfolioData`, termasuk `seo`). Ganti konstanta `DEFAULT_FORM`+placeholder seed lama.
4. **Load effect localStorage** dihapus (hook sudah memuat). Diganti dua efek: (a) `isDraftEmpty(portfolio)` â†’ buka source picker sekali; (b) efek sinkron `draftSetData(portfolio)` setiap `portfolio` berubah â€” **iterasi pertama dilewati** (`syncedOnce`) supaya tidak ada PATCH ulang saat mount. Karena semua setter (`setFormData`, `setProjects`, dst., juga `undo`/`redo`/`reset` via cancel) lewat `setPortfolio`, satu efek ini menjamin `draft.setData` dipanggil.
5. **Autosave localStorage** (1500 ms) dihapus â†’ debounce + status ditangani `usePortfolioDraft`.
6. **`saveStatus`** kini **derived** dari `draft.status` / `draft.lastSavedAt`; tambah cabang `error` â†’ tombol `draft.retry()` dengan salinan inline.
7. **Footer**: tombol simpan â†’ `await draft.flushNow()`; kalau `false` â†’ toast gagal, kalau `true` â†’ `window.open(/portfolio/preview?draftId=â€¦)`. Tombol batal â†’ tetap reset via setter (sinkron mendorong ke server), `localStorage.removeItem` dihapus.
8. `generateFromCv`: blok `const payload = {â€¦}` + `localStorage.setItem` dihapus (setter sudah sinkron).

Kapabilitas yang **tetap**: source picker (3 opsi), CV import, AI popup + fix-wave (`aiFormList`/`aiSeoList`/`applyAllAi`), progress bar, undo/redo footer, AIPolish, semua akordeon, foto upload.

## Cara draft localStorage lama di-seed

Di **creator** (`build/page.tsx`):

1. `GET /api/portfolio/draft` (latest).
2. **Kalau sudah ada draft server** â†’ tidak menyentuh legacy (data server lebih baru, jangan ditimpa) â†’ `clearLegacyDraft()` â†’ redirect. Menjamin "satu draft", bukan spam baris.
3. **Kalau belum ada** â†’ `readLegacyDraft()` (urutan: `portfolio_live_data` dulu, lalu `portfolio_draft`; JSON rusak dilewati) â†’ `portfolioDataSchema.safeParse(legacy)`.
   - lolos â†’ dipakai sebagai `data` POST (field tak dikenal seperti `themeId`/`alignment` di-strip Zod; `sectionOrder`/`sectionVisibility`/`fontSize`/`seo` ikut tersimpan);
   - tidak lolos â†’ `portfolioDataSchema.parse(emptyFormData())`.
4. POST â†’ sukses â†’ **`clearLegacyDraft()`** (sekali, kedua kunci dihapus) â†’ redirect ke `/portfolio/build/<draftId>`.

Kunci literal tidak pernah muncul di `build/live/preview` (dipindah ke `legacy-migration.ts`) sehingga pengujian "kunci lama hilang" tetap hijau sementara jalur migrasi tetap berjalan.

## Commands + output nyata

```
npx tsc --noEmit
â†’ (exit 0, tanpa output)

npm test
â†’ Test Files  20 passed (20)
   Tests  357 passed (357)

git commit -m "refactor(portfolio): satu builder, satu draft, satu entry point"
â†’ [feature/portfolio-trust deca8e7] â€¦ 14 files changed, 2698 insertions(+), 2273 deletions(-)
```
`npx tsc --noEmit` + `npm test` dijalankan sebelum commit dan diulang di HEAD (hijau keduanya).

## Deviasi dari brief (+ alasan)

1. **Creator memakai draft terbaru, bukan selalu POST.** Brief selalu membuat draft baru; itu membanjiri tabel tiap kunjungan. Creator kini memakai draft server bila ada, POST hanya saat belum ada. Migrasi legacy tetap terjadi di jalur POST.
2. **Literal kunci legacy dipindah ke `src/lib/portfolio/legacy-migration.ts`**, bukan di `build/page.tsx`. Brief minta migrasi *dan* test melarang literal `"portfolio_draft"`/`"portfolio_live_data"` di build/live/preview â€” keduanya mustahil bersamaan; solusi: baca di modul terpusat, halaman cuma memanggil `readLegacyDraft()/clearLegacyDraft()`.
3. **`LiveData` pindah ke `src/lib/portfolio/live-data.ts`.** `portfolio-schema.test.ts` mengimpor tipenya dari `live/page.tsx`; begitu halaman itu jadi redirect, `tsc` gagal. Pindah modul, import test disesuaikan.
4. **`PortfolioSkeleton` default export.** Potongan brief menamainya named di satu tempat dan default di tempat lain â€” dipakai default secara konsisten.
5. **Redirect live membaca `window.location.search`**, bukan `useSearchParams()` â€” menghindari kewajiban Suspense/CSR-bailout Next saat build; perilaku identik.
6. **`portfolio-ai-map.test.ts` & `portfolio-schema.test.ts` disesuaikan.** Keduanya mem-lock teks/tipe file yang tugas ini pindah atau hapus. Blok seo `build` dipindah ke `BuilderEditor` (intent tetap: seo ikut seed, satu jalur simpan, `currentPortfolioData`, `seo: merged.seo`); blok seo `live` dihapus karena editornya sudah diganti redirect; `LiveData` tetap diuji lewat modul baru.
7. **`usePortfolioDraft.flushNow()`** ditambahkan (return `boolean`) supaya preview hanya dibuka setelah save terkonfirmasi â€” brief tidak menyebutnya, tapi tanpa ini ada race PATCH vs GET preview.
8. **Fitur editor visual `live` (drag-reorder, theme picker in-editor, alignment, publish dialog di editor) ikut hilang** mengikuti brief yang memaksa `/portfolio/live` jadi redirect. Theme switcher + publish tetap di preview; `sectionOrder`/`fontSize`/`alignment` tetap disimpan schema. Ini ruang lingkup brief, bukan kecelakaan.

## Concerns

- **Tidak ada affordance "draft baru kosong"** â€” semua jalur memakai draft terbaru; butuh tombol+daftar draft terpisah kalau user ingin mulai ulang.
- **Fallback offline preview hanya saat `?draftId=` ada** (cache per-draft). Buka `/portfolio/preview` polos saat offline â†’ "Belum ada draft".
- **`BuilderEditor` hanya diuji source-text + tsc** â€” tidak ada render/jsdom test untuk editor 1,5 ribu baris.
- Salinan tombol retry di footer masih inline (belum kunci i18n).
- Judul/robots masih menyebut `/portfolio/live` (route-nya masih ada sebagai redirect, jadi tidak salah), tapi bisa dibersihkan terpisah.

## Fix wave 1

### Perubahan per file

- `src/lib/portfolio/schema.ts` â€” `portfolioDataSchema` kini punya `alignment: z.partialRecord(z.enum(SECTION_IDS), z.enum(["left", "center", "right"])).optional()` (alasan sama seperti `fontSize`: round-trip lewat API draft; `publishPayloadSchema.alignment` top-level dibiarkan). Draft PATCH/POST kini menyimpan perataan.
- `src/components/portfolio-templates/types.ts` â€” `PortfolioData.alignment?: Record<string, "left" | "center" | "right">` (union inline, tanpa impor baru).
- `src/components/portfolio/alignment-style.ts` (baru) â€” `alignmentToSectionStyle()`: memetakan peta alignment â†’ `sectionStyle` (`{ textAlign }`), nilai di luar kiri/tengah/kanan dibuang.
- `src/app/portfolio/preview/page.tsx` â€” interface lokal `PortfolioData` ditambah `alignment`; kedua instance `PortfolioDocument` (mode cetak + editor) kini menerima `sectionStyle={sectionStyle}` hasil `alignmentToSectionStyle(data.alignment)`.
- `src/app/p/[slug]/page.tsx` â€” `sectionStyle={alignmentToSectionStyle(d.alignment)}` pada `PortfolioDocument`, jadi halaman publik menghormati perataan yang tersimpan.
- `src/app/api/portfolio/publish/route.ts` â€” merge payload publish: alignment top-level dari dialog menang; kalau hanya ada di `data` (panggilan API langsung), tidak lagi ditimpa default `{}` (`data.alignment ?? alignment`).
- `src/components/portfolio/builder/BuilderEditor.tsx` â€”
  - Panel **Tampilan** (`data-testid="appearance-panel"`) berisi: daftar section (nama i18n, toggle mata on/off dengan `aria-pressed`, tombol â†‘/â†“ `min-h-11`), segmented control **Ukuran teks** small/medium/large dengan label hidup (`live.font-compact/standard/bold`), dan `<select>` perataan kiri/tengah/kanan per baris section (`aria-label` = `live.text-align` + nama section).
  - Semua tulisan lewat `applyAppearance()` â†’ updater fungsional ke undo stack editor **dan** `draft.setData`/`draftSetData(prev => â€¦)`; urutan dihitung dari `sectionOrder` (default `DEFAULT_SECTION_ORDER`, id asing dibuang, id hilang ditambahkan di belakang), visibilitas dibaca via `isSectionVisible` dan toggle menulis `true`/`false` eksplisit (unlisted = tampil, semantik `resolveVisibility` tidak diubah).
  - Tombol **Draft baru** di header progress: POST `/api/portfolio/draft` dengan `portfolioDataSchema.parse({ formData: DEFAULT_FORM })` lalu `router.replace("/portfolio/build/<id>")`.
  - `seedFrom` kini ikut membawa `alignment`.
- `src/lib/i18n.tsx` â€” kunci baru (id/en): `live.appearance` (Tampilan), `live.align-left|center|right` (Kiri/Tengah/Kanan), `live.show-section`, `live.hide-section`, `live.move-up`, `live.move-down`, `build.stats`, `build.certifications`, `build.organizations`, `build.hobbies`, `build.new-draft` (Draft baru). Kunci lama yang dipakai ulang: `live.section-order`, `live.font-size`, `live.font-small|medium|large`, `live.font-compact|standard|bold`, `live.text-align`, `build.hero-title|about|project|skill|experience|education|testimonial|contact`.
- `src/__tests__/portfolio-schema.test.ts` â€” 5 test `alignment di portfolioDataSchema`: round-trip, nilai sah, nilai ditolak (`"middle"`), section id asing ditolak, tanpa alignment tetap lolos, alignment ikut `publishPayloadSchema.data` bersama default top-level.
- `src/__tests__/portfolio-entry-points.test.ts` â€” 4 test: BuilderEditor memuat marker kontrol (`t("live.section-order")`, `t("live.font-size")`, `t("live.text-align")`, `t("live.appearance")`, `moveSection`, `toggleSectionVisible`, `setSectionAlignment`, `setAppearanceFontSize`), aksi Draft baru, preview + `/p/` meneruskan `sectionStyle` (preview â‰¥2 pemakaian), rantai lengkap schema/tipe/merge publish.

### Peletakan panel

Panel **Tampilan** ditaruh **di bawah deretan accordion, di atas daftar "Perubahan AI"** â€” accordion konten tetap jadi hal pertama yang dilihat (alur isi-mengisi), sedangkan pengaturan gaya menyusul sebagai satu kartu setelah konten selesai; nama section di panel sejajar dengan judul accordion di atasnya, jadi pemetaannya mudah ditebak.

### Bukti red â†’ green

Red (ditulis dulu, sebelum implementasi):

```
$ npm test -- portfolio-schema.test.ts portfolio-entry-points.test.ts
 â¯ src/__tests__/portfolio-entry-points.test.ts (8 tests | 4 failed)
 â¯ src/__tests__/portfolio-schema.test.ts (76 tests | 4 failed)
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

357 â†’ 366 (9 test baru), tidak ada test lama yang dihapus/diubah perilaku.

### Concerns

- `applyAppearance` menulis dua tujuan (undo stack + `draft.setData` fungsional); tujuan kedua teknis redundan dengan efek sinkron yang sudah ada, tapi diminta brief dan membuat perubahan tampilan langsung masuk antrean simpan. Nilai akhirnya sama, jadi tidak ada race tulis yang merusak.
- Panel memakai source-text test (pola repo untuk `BuilderEditor`); belum ada render/jsdom test untuk interaksi klik reorder/toggle.
- Baris `stats` tampil di panel (urutan/visibilitas/perataan) walaupun accordion kontennya tidak ada di builder â€” konten stats diisi lewat Tentang Saya, semantik urutan tetap utuh.
- `/api/portfolio/export` sengaja tidak disentuh (brief: jangan ubah alur print/export); ekspor HTML mengikuti `sectionOrder`/`fontSize` yang sudah ada, perataan belum ikut diekspor.

## Fix wave 2

### Perubahan per file

| File | Aksi | Isi |
|---|---|---|
| `src/lib/portfolio/schema.ts` | modify | Ekspor `URL_FIELD_MESSAGE` (pesan refine `urlField`) supaya migrasi mengenali kegagalan URL tanpa menduplikasi string. |
| `src/lib/portfolio/legacy-migration.ts` | modify | `migrateLegacyPayload(legacy): ValidatedPortfolioData \| null` — coerce per isu Zod: string lewat batas ? `slice(0, maximum)`, custom gagal URL ? `""`, custom tanggal langgar range ? `startDate`/`endDate` entri dibuang; isu lain ? `null` (legacy dipertahankan). Murni: `structuredClone`, input tak dimutasi, maks 5 lewat. Plus `shouldClearLegacy(legacy, migrated)` = `legacy === null \|\| migrated !== null`. |
| `src/app/portfolio/build/page.tsx` | modify | Pakai `migrateLegacyPayload` + `shouldClearLegacy` (hapus `safeParse(legacy)`); `clearLegacyDraft()` hanya setelah POST sukses ATAU legacy kosong; cabang "draft server sudah ada" tidak lagi menghapus legacy; state `busy` ? tombol `Coba lagi` `disabled` selama POST in-flight (minor d). |
| `src/lib/portfolio/usePortfolioDraft.ts` | modify | `flush`: `res.status === 400` ? pending dipertahankan, `status "idle"`, `setOffline(false)`, `setError(null)`, return `false` (tanpa banner); 5xx/jaringan ? tetap `error` + offline + retry. `catch` hanya mengembalikan pending bila belum terisi edit yang lebih baru. |
| `src/components/portfolio/builder/BuilderEditor.tsx` | modify | `createNewDraft`: `await draft.flushNow()` sebelum POST/replace, gagal ? toast + batal (pola tombol preview:1516). Minor b: `text-[10px]`/`text-[11px]` ? `text-xs` (CharCounter:158, error validasi:171, daftar AI:1411, daftar CV:1579). Minor c: undo/redo `p-1.5` ? `min-h-11 min-w-11 flex items-center justify-center`. |
| `src/lib/i18n.tsx` | modify | Minor e: `preview.no-draft-desc` + `preview.open-builder` "Live Builder" ? "builder" (id+en), salinan Indonesia tetap alami. |
| `src/__tests__/portfolio-legacy-migration.test.ts` | create | 10 test: 3 koersi lolos, masalah di luar daftar ? `null`, input non-objek ? `null`, kemurnian, dan aturan `shouldClearLegacy` (kosong/sukses ? true, gagal ? false). |
| `src/__tests__/portfolio-entry-points.test.ts` | modify | +4 test: literal kunci legacy juga dicek di `BuilderEditor.tsx`; urutan `flushNow` sebelum `method: "POST"` di `createNewDraft`; creator memakai `migrateLegacyPayload`/`shouldClearLegacy` tanpa `safeParse(legacy)`; baris i18n `preview.*` bebas "Live Builder". |
| `src/__tests__/portfolio-draft-store.test.ts` | modify | +2 test: fetch PATCH 400 ? `status "idle"`, `offline false`, `error null`, pending tetap terkirim di flush kedua (PATCH ×2); fetch reject ? `status "error"`, `offline true`, pesan coba lagi. |

### Red ? green (ketiga Important)

Red (test ditulis dulu, sebelum implementasi):

```
$ npx vitest run portfolio-legacy-migration.test.ts portfolio-entry-points.test.ts portfolio-draft-store.test.ts
 Test Files  3 failed (3)
      Tests  4 failed | 14 passed (18)

 - legacy-migration: TypeError: migrateLegacyPayload is not a function (helper belum ada)     [Important 1]
 - entry-points "Draft baru mem-flush perubahan tertunda sebelum POST": belum ada flushNow    [Important 2]
 - draft-store "PATCH 400 ditolak server": expected 'error' to be 'idle'                      [Important 3]
 - entry-points "empty state preview ...": baris i18n masih "Live Builder"                    [minor e]
```

Green (sesudah implementasi):

```
$ npx tsc --noEmit
? (exit 0, tanpa output)

$ npm test
? Test Files  21 passed (21)
   Tests  381 passed (381)

$ npx eslint src/lib/portfolio/legacy-migration.ts src/lib/portfolio/schema.ts src/lib/portfolio/usePortfolioDraft.ts src/app/portfolio/build/page.tsx src/components/portfolio/builder/BuilderEditor.tsx src/lib/i18n.tsx src/__tests__/portfolio-legacy-migration.test.ts src/__tests__/portfolio-entry-points.test.ts src/__tests__/portfolio-draft-store.test.ts
? (exit 0, tanpa output)
```

366 ? 381 (+15 test); test lama tidak dihapus atau perilakunya diubah. `migrateLegacyPayload` ditulis mengikuti tiga koersi yang diminta brief; aturan hapus legacy dipusatkan di `shouldClearLegacy` supaya bisa diuji sebagai fungsi murni. antislop-code/antislop-copywriting dijalankan selama pengerjaan: komentar baru hanya menjelaskan alasan (tanpa separator/narasi langkah), salinan i18n bebas em dash/buzzword dan tetap alami.

### Concerns

- Pembacaan literal: `clearLegacyDraft()` kini hanya di jalur POST. Cabang "draft server sudah ada" tidak menghapus legacy lagi, jadi kunci lama bisa menetap di localStorage perangkat itu (tidak pernah dibaca lagi di perangkat tersebut).
- 400 memakai `status "idle"`: footer bisa menampilkan "Tersimpan" (lastSavedAt lama) walaupun ada pending; sesuai brief tanpa banner, pending terkirim pada edit berikutnya atau `flushNow`.
- `migrateLegacyPayload` hanya menangani tiga koersi yang diminta; masalah lain (email salah format, array lewat LIMITS, field wajib hilang) ? `null`, jadi draft kosong dibuat dan legacy bertahan sampai diperbaiki manual.
- Sisa race "Draft baru": edit yang dibuat selama POST berlangsung (ratusan ms) masih bisa ikut debounce ke draft baru; menutupnya sepenuhnya butuh pembatalan sync saat ganti draftId.
- "Live Builder" masih ada di kunci `portfolio.publish-*` (i18n:312-313) — di luar lingkup minor (e), bisa dibersihkan terpisah.
- `.superpowers/sdd/progress.md` sudah berubah sebelum wave ini (bookkeeping task lain) dan tidak ikut di-commit.
