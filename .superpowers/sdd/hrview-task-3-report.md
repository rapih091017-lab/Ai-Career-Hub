# Laporan Task 3 — Bawa `meta` ke layar, rapikan mapping hasil tersimpan

Status: **DONE_WITH_CONCERNS**
Commit: `38d25ba9b22ad3d5cacb37403b86afafc0fba74b` (branch `master`, satu commit)

---

## Ringkasan

Tiga bagian hasil analisis yang tidak pernah sampai ke layar sekarang dibawa
sampai ke `AnalysisResult`: `meta` (dari route), `careerVelocity` dan
`atsPredictionDetail` (dideklarasikan di tipe dan dipetakan oleh fungsi murni).
Mapping manual di `/checker/[id]` diganti pemanggilan
`analysisFromFullResult`. Tidak ada migrasi database — `meta` masuk ke kolom
jsonb `full_result` yang sudah ada.

Tidak ada panel HR yang dibangun; ini murni pengangkutan data.

## Perubahan per file

### 1. `src/__tests__/checker-analysis-from-full-result.test.ts` (baru)
Tiga test dari brief, ditulis lebih dulu sebelum ada implementasinya:
membawa ketiga field baru; baris lama tanpa `meta` tetap valid (semua `null`,
`grade` tetap terbaca); `fullResult: null` tidak melempar error.

### 2. `src/components/checker/types.ts` (`AnalysisResult`)
Tiga field opsional ditambahkan setelah `aiModel`, persis seperti blok di
brief: `meta`, `careerVelocity`, `atsPredictionDetail`. Semuanya opsional
(`| null`) supaya baris lama yang tidak punya field tersebut tetap cocok dengan
tipe.

### 3. `src/lib/checker/analysis-from-full-result.ts` (baru)
Fungsi murni `analysisFromFullResult(id, data)`. Semua akses lewat `AnyRecord`
lalu di-`??` ke default, sehingga kolom jsonb yang tidak lengkap tidak
menjadi error. Ketiga field baru dipetakan di sini, itulah satu-satunya tempat
di mana bentuk hasil tersimpan ditentukan.

### 4. `src/app/api/checker/analyze/route.ts`
Satu baris ditambahkan pada objek `aiStructuredData`:

```ts
    // meta belum pernah diteruskan; detected_seniority di dalamnya dibutuhkan panel sisi HR.
    meta: aiAnalysis?.meta ?? null,
```

Ditempatkan tepat sebelum `careerVelocity` sesuai brief. Sumbernya sudah ada
di `AnalysisResultSchema` (`src/lib/ai/prompts/schemas.ts:59`, bertipe
`.optional()`), jadi tidak ada perubahan pada parsing/zod.

### 5. `src/app/checker/[id]/page.tsx`
Seluruh blok `setResult({...})` diganti pemanggilan mapper, dan import baru
ditambahkan. Variabel `full` tetap dipakai untuk `setFullResult(full)`;
variabel `scores`/`aiFeedback` yang sebelumnya dipakai lokal sudah tidak
perlu dan ikut hilang.

## Perintah dan output

### Langkah 2 — bukti test gagal sebelum implementasi

```
> npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot

 FAIL  src/__tests__/checker-analysis-from-full-result.test.ts [
src/__tests__/checker-analysis-from-full-result.test.ts ]
Error: Failed to resolve import "@/lib/checker/analysis-from-full-result" from
"src/__tests__/checker-analysis-from-full-result.test.ts". Does the file exist?
  Plugin: vite:import-analysis
 Test Files  1 failed (1)
      Tests  no tests
```

Gagal karena modul belum ada — persis yang diharapkan brief, dan membuktikan
test benar-benar bergantung pada implementasi baru, bukan pada kode yang
kebetulan sudah lewat.

### Langkah 7 — test baru hijau

```
> npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  1.02s
```

### Langkah 8 — typecheck

Percobaan pertama gagal dengan satu error:

```
> npx tsc --noEmit -p tsconfig.json
src/lib/checker/analysis-from-full-result.ts(41,5): error TS2739: Type 'AnyRecord' is missing the
following properties from type '{ summary: BreakdownSection; experience: ExperienceSection; skills:
SkillsSection; education: EducationSection; format_ats: FormatAtsSection; }': summary, experience,
skills, education, format_ats
exit=2
```

Setelah cast `breakdown` dipersempit (lihat "Ambiguitas" di bawah):

```
> npx tsc --noEmit -p tsconfig.json
exit=0
```

Tidak ada output, sesuai syarat.

### Suite penuh

```
> npx vitest run --reporter=dot
 Test Files  74 passed | 1 skipped (75)
      Tests  860 passed | 1 skipped (861)
   Duration  24.79s
exit=0
```

Guard `src/__tests__/ai-prompt-replace-safety.test.ts` tetap hijau; tidak ada
kode prompt building yang disentuh.

## Ambiguitas di brief dan cara penyelesaiannya

**1. `breakdown` di-cast ke `AnyRecord` tapi harus cocok dengan tipe yang punya
field wajib.** Blok mapper di brief menulis
`const breakdown = (full.breakdown ?? null) as AnyRecord;`. `AnyRecord` adalah
`Record<string, any>`, dan TypeScript tidak memakai index signature untuk
memenuhi properti wajib pada tipe target, jadi `tsc` menolak (TS2739, di atas).
Brief sendiri mensyaratkan `tsc` bersih, jadi keduanya tidak bisa dipenuhi
apa adanya. Yang berubah hanya satu baris cast:

```ts
  const breakdown = (full.breakdown ?? null) as AnalysisResult["breakdown"];
```

Nilai runtime-nya identik dengan versi brief (tetap objek dari jsonb apa adanya,
tanpa validasi) — hanya anotasi tipenya yang dipersempit ke bentuk yang
dijanjikan `AnalysisResult`. Semua baris lain dipakai verbatim.

**2. `fitLabel` hilang dari mapper.** Versi lama halaman tersebut menjalankan
`fitLabel: full?.breakdown?.overall ? "Good" : undefined`. Mapper di brief tidak
memasukkannya, jadi ikut hilang. Ini aman: `fitLabel` di halaman detail hanya
di-*set*, tidak pernah di-*render* — satu-satunya pemakai ada di
`src/app/checker/page.tsx:807` yang mendapat hasil analisis langsung. Tidak ada
perubahan tampilan. Tetap dicatat karena ini perubahan perilaku yang tidak
disebut brief.

**3. TypeScript strictness repo.** `AnyRecord` memakai `any`, jadi
`tsconfig.json` kemungkinan tidak mengaktifkan `noImplicitAny` yang ketat pada
file ini. Baris tersebut diambil verbatim dari brief, bukan gaya saya.

## Kekhawatiran

- **`AnyRecord` memakai `any`.** File baru ini sama sekali tidak dianotasi,
  meski tujuannya justru mengurangi `any` dari `page.tsx`. Mapper memindahkan
  `any` dari komponen ke lib, belum menghilangkannya. Kalau nanti tim memperketat
  lint, dua file ini akan kena. Tidak saya ubah karena brief menetapkan
  kode persis.
- **`breakdown` tidak divalidasi bentuknya.** Baris jsonb yang rusak (misalnya
  `breakdown` berupa string) akan lolos ke UI. Ini perilaku lama juga, hanya
  sekarang lebih tersembunyi di satu fungsi. Bentuk tes masih mengasumsikan
  `fullResult` berbentuk objek.
- **Baris lama di produksi** tidak punya `meta` sama sekali, jadi panel HR
  (task berikutnya) harus sudah mengandalkan `null` dan merender fallback —
  bukan `detected_seniority` yang selalu ada. Test kedua muncul untuk mengunci
 _expectation_ itu.
- **Berkas lain di working tree tidak ikut di-commit.** `progress.md`, `skills`,
  dan `.codex/` sudah berubah/ada sebelum task ini dan sengaja tidak di-stage.

---

# Tambahan — Tiga temuan review Task 3

Status: **DONE_WITH_CONCERNS**

Semua temuan diverifikasi dulu terhadap kode nyata sebelum dikerjakan:
`IssueArr()` memang `z.array(z.union([z.string(), z.object({...})]))`
(`src/lib/ai/prompts/schemas.ts:15-24`), `prompt-schemas.test.ts:100` memang
mengisi `risk_factors: ["Kurang TypeScript"]`, dan `[id]/page.tsx` memang
membaca `breakdown.summary.score` dan sejenisnya tanpa penjaga.

## Temuan 1 — `risk_factors` salah tipe

`atsPredictionDetail.risk_factors` diubah dari objek-saja menjadi
`(string | IssueItem)[]`, sama dengan `strengths` di interface yang sama
(`types.ts:198-209`). Dipakai `IssueItem` yang sudah diekspor, bukan bentuk
inline, jadi kedua sisi benar-benar identik dan langsung bisa dipakai
`toIssueItems()` oleh panel sisi HR berikutnya.

Entry string tidak dibuang di mana pun: `toIssueList()` di mapper membiarkan
string lolos apa adanya (hanya membuang entri yang bukan string dan bukan objek
ber-`text`). Test mengunci ini dua kali — nilai yang dikembalikan mapper, dan
hasil `toIssueItems()` atas nilai tersebut.

## Temuan 2 — mapper menormalkan, bukan mengklaim bentuk

`analysisFromFullResult` tidak lagi memakai
`as AnalysisResult["breakdown"]`. Setiap field yang dibaca halaman tanpa
penjaga dilewatkan fungsi normalisasi:

| Field tersimpan | Yang dinormalkan | Default |
|---|---|---|
| `breakdown` | 5 section + `issues`/`suggestions`/`tips`/`missing_skills`/`recommendations` | `score` 50, array kosong, `relevance` `""` |
| `keywordAnalysis` | 4 array + `match_rate_pct` | array kosong, `0` |
| `narrativeFeedback` | `overall_assessment` + 3 array | `""`, array kosong |
| `actionPlan` | 3 array | array kosong |
| `bulletReview` | tiap item: `section`, `original_text`, `issues`, `suggested_rewrite`, `priority`, `cari_score` | `priority` `"Medium"` |
| `missingSections` | harus array | `[]` |

Nilai default sengaja mengikuti `.catch()` di `AnalysisResultSchema`
(`schemas.ts:89-141`) — 50 untuk score section, 0 untuk `match_rate_pct` — agar
hasil tersimpan punya bentuk yang sama persis dengan hasil langsung yang selalu
lengkap karena lewat zod.

Kalau `breakdown` sendiri tidak ada (atau bukan objek), hasilnya tetap `null`
dan halaman menyembunyikan section-nya seperti sebelumnya; hanya `breakdown: {}`
atau terpotong yang kini lima section-nya terisi default, bukan melempar
`TypeError`.

Daftar lengkap akses nested `[id]/page.tsx` yang jadi acuan:

- `breakdown` — `breakdown.summary.score|.issues|.suggestions` (`:212`),
  `breakdown.experience.score|.issues|.suggestions` (`:213`),
  `breakdown.skills.score` + `missing_skills` + `recommendations` (`:214`),
  `breakdown.education.score|.relevance|.suggestions` (`:215`),
  `breakdown.format_ats.score|.issues|.tips` (`:216`),
  `breakdown?.experience.quantification_pct` (`:136`).
- `narrativeFeedback` — `overall_assessment` (`:232`), `strengths` (`:235,241`),
  `areas_for_improvement` (`:247,253`), `ats_recommendations` (`:260,265`).
- `keywordAnalysis` — `match_rate_pct` (`:287`), `matched` (`:299-303`),
  `missing_critical` (`:307-311`), `missing_nice_to_have` (`:315-319`),
  `synonym_suggestions` (`:323-327`).
- `actionPlan` — `quick_wins`/`short_term`/`long_term` (`:48-50` di
  `ImprovementChecklist.tsx`, pemanggilnya baris `:340`); tanpa normalisasi,
  string di tempat array akan membuat `.forEach` melempar.
- `bulletReview` — `length`/`.map` di `:349-361`, lalu
  `BulletReviewCard` membaca `section`, `original_text`, `issues`,
  `suggested_rewrite`, `priority`, `cari_score`.
- `impactForecast` — diteruskan apa adanya karena `ImpactForecastCard`
  sudah memeriksa sendiri bahwa `current_score` dan
  `projected_after_all_fixes` bertipe number sebelum merender
  (`ImpactForecastCard.tsx:15-20`), jadi data rusak hanya membuat kartu hilang.
  Sama untuk `meta`, `careerVelocity`, `atsPredictionDetail`,
  `weightsApplied`: seluruh field di dalamnya opsional di sisi Client.

## Temuan 3 — mapping lama dipin, kedua sumber hasil disamakan

- Test `kunci hasil dipin agar field tidak hilang diam-diam` mengunci 18 kunci
  hasil, jadi kehilangan field di masa depan gagal langsung. `fitLabel` tidak
  ada di daftar itu, dengan alasan yang sama seperti di bagian atas: ekspresi
  lama membaca `breakdown.overall` yang tidak pernah ada, jadi selalu
  `undefined`, dan hanya `/checker/page.tsx` yang membacanya.
- `weightsApplied` sekarang diteruskan dari `fullResult`.
- `aiModel` diteruskan dari argumen `StoredResult.aiModel` (field yang sama
  dengan response route analyze). Catatan: route
  `/api/checker/history/[id]` **tidak pernah** mengembalikan `aiModel` dan kolom
  jsonb juga tidak menyimpannya, jadi nilainya masih `undefined` sampai route
  itu berubah — lihat Kekhawatiran. Halaman `[id]` sudah meneruskannya
  (`page.tsx:64-71`), jadi begitu route menyediakan field itu halaman ikut
  benar tanpa disentuh lagi.

`/checker/page.tsx` (halaman live) tidak berubah sama sekali.

## Perintah dan output

### Langkah 1 — test baru gagal sebelum implementasi

```
> npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot

  Test Files  1 failed (1)
       Tests  5 failed | 5 passed (10)
```

Gagal dengan alasan yang tepat:

```
> "breakdown kosong menghasilkan lima section yang aman dibaca"
AssertionError: expected [] to deeply equal [ 'education', 'experience', …(3) ]

> "section yang ada tetap utuh, section yang hilang diisi default"
TypeError: Cannot read properties of undefined (reading 'score')

> "koleksi yang bukan array diabaikan, bukan dipakai apa adanya"
AssertionError: expected undefined to be 50

> "weightsApplied dan aiModel diteruskan"
AssertionError: expected undefined to deeply equal { 'education_weight': 0.1, … }

> "kunci hasil dipin agar field tidak hilang diam-diam"
-   "aiModel",
-   "weightsApplied",
```

### Langkah 2 — pin tipe union (hanya bisa dilihat oleh tsc)

```
> npx tsc --noEmit -p tsconfig.json
src/__tests__/checker-analysis-from-full-result.test.ts(54,95): error TS2322: Type 'string' is not
  assignable to type '{ text: string; severity?: … ; source_excerpt?: string | null | undefined; }'.
src/__tests__/checker-analysis-from-full-result.test.ts(223,7): error TS2353: Object literal may only
  specify known properties, and 'aiModel' does not exist in type 'StoredResult'.
exit=2
```

Baris 54 adalah bukti langsung bahwa `risk_factors` sebelumnya tidak menerima
string, padahal schema dan data tersimpan memang mengirimnya.

### Langkah 3 — test hijau setelah perbaikan

```
> npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot

  Test Files  1 passed (1)
       Tests  10 passed (10)
    Duration  1.63s
```

### Langkah 4 — typecheck

```
> npx tsc --noEmit -p tsconfig.json
exit=0
```

### Suite penuh

```
> npx vitest run --reporter=dot
  Test Files  74 passed | 1 skipped (75)
       Tests  867 passed | 1 skipped (868)
    Duration  24.71s
exit=0
```

### Build

```
> npm run build
…
✓ Compiled successfully
…
exit=0
```

## Kekhawatiran

- **`aiModel` belum punya sumber data di halaman hasil tersimpan.** Mapper dan
  halaman sudah meneruskannya, tapi `/api/checker/history/[id]` tidak
  mengembalikan field itu (select hanya `id, scores, aiFeedback, fullResult,
  cvTextExtracted, jobDescription, createdAt`) dan kolom `fullResult` juga tidak
  pernah menyimpannya. Perlu keputusan terpisah: tambah field saat analyze,
  atau menerima badge model tidak tampil di `/checker/[id]`. Tidak saya kerjakan
  karena route dan skema DB di luar daftar berkas yang boleh diubah.
- **Section breakdown yang hilang diisi skor 50, bukan disembunyikan.** Ini
  mengikuti `.catch()` schema supaya bentuk kedua sumber hasil sama, dan
  `breakdown: {}` saja yang kena — baris yang memang tidak punya breakdown tetap
  `null` dan section-nya tidak tampil.
- **`bulletReview` kini di-*shape* ulang**, jadi field yang tidak ada pada item
  lama terisi default (`""`, `[]`, `"Medium"`), bukan `undefined` seperti
  sebelumnya. `BulletReviewCard` sudah menjaganya sendiri, jadi tidak ada
  perubahan tampilan, tapi nilainya berbeda.
- **Normalisasi masih bukan validasi ketat.** Mapper menerima jsonb yang isinya
  bukan objek lalu membuangnya; ia tidak menolak baris yang aneh-aneh. Cukup
  untuk mencegah crash, bukan jaminan integritas data.
- **Test `bacaSepertiHalaman`** menyalin akses nested halaman detail saat ini,
  jadi harus diperbarui kalau aksesnya berubah — itulah gunanya: jadi pengaman
  sampai task berikutnya selesai.

---

# Tambahan — Empat temuan review Task 3 (putaran kedua)

Status: **DONE_WITH_CONCERNS**

Temuan 1, 2, dan 4 ditutup: data yang tidak pernah ada tidak lagi ditampilkan
seolah-olah ada. Satu penyimpangan dari brief ada di Temuan 2 dan dijelaskan di
bawah; sisanya dikerjakan sesuai brief.

## Temuan 1 — `aiModel` sekarang punya sumber data

Cek ulang jalur jsonb: `fullResult` memang kolom jsonb yang menyimpan objek
`aiStructuredData` utuh (`route.ts:317`), dan `/api/checker/history/[id]`
mengirimkan kolom itu apa adanya. Jadi ada tempat yang benar untuk model —
tanpa kolom baru dan tanpa migrasi.

- `route.ts` menulis `aiModel: aiModelLabel` ke dalam `aiStructuredData`, jadi
  ikut tersimpan ke `full_result` pada setiap baris baru. Nilai dihitung sekali
  (`aiAnalysis ? (useReasoner ? "V4 Pro" : "V4 Flash") : null`) lalu dipakai
  dua kali: untuk jsonb dan untuk response.
- Field `aiModel` dihapus dari antarmuka `StoredResult`. Tidak ada lagi jalur
  yang membaca `data.aiModel`, jadi halaman `[id]` tidak boleh mengirim
  `data.aiModel` juga — sudah dihapus.
- Mapper membaca `full.aiModel` dan hanya menerima `"V4 Pro"`/`"V4 Flash"`.
  Baris lama (dan nilai ngawur) jadi `undefined`, bukan error.
- Bentuk response analyze tidak berubah: `aiModel` ditulis ulang **setelah**
  `...aiStructuredData` dengan nilai `aiModelLabel ?? undefined`, jadi key tetap
  hilang dari JSON saat AI gagal (perilaku lama), bukan `null`.

## Temuan 2 — section yang tidak tersimpan tidak lagi dibuat jadi skor 50

Aturan baru: sebuah section breakdown hanya diteruskan kalau ia punya `score`
yang benar-benar angka finite. Kalau tidak, section itu **absen**. Kalau tidak
ada section sama sekali, `breakdown` bernilai `null`. Tidak ada lagi jalur yang
menghasilkan angka skor yang tidak dihitung, jadi tidak perlu penanda "default"
di `SectionScoreCard`.

`[id]/page.tsx` sekarang merender lima `SectionScoreCard` di dalam penjaga
masing-masing, dan bagian "PER-SECTION BREAKDOWN" disembunyikan kalau `breakdown`
kosong. `quantPct` sudah aman sejak awal (`breakdown?.experience`).

**Penyimpangan dari brief:** brief meminta `AnalysisResult["breakdown"]` dibuat
opsional. Itu tidak bisa dilakukan tanpa menyentuh `/checker/page.tsx`, yang
brief larang dan yang tetap membaca kelima section tanpa penjaga. Bukti:

```
> npx tsc --noEmit -p tsconfig.json
src/app/checker/[id]/page.tsx(215,82): error TS18048: 'breakdown.summary' is possibly 'undefined'.
src/app/checker/[id]/page.tsx(215,115): error TS18048: 'breakdown.summary' is possibly 'undefined'.
src/app/checker/[id]/page.tsx(215,154): error TS18048: 'breakdown.summary' is possibly 'undefined'.
src/app/checker/page.tsx(854,71): error TS18048: 'breakdown.summary' is possibly 'undefined'.
src/app/checker/page.tsx(854,104): error TS18048: 'breakdown.summary' is possibly 'undefined'.
src/app/checker/page.tsx(854,143): error TS18048: 'breakdown.summary' is possibly 'undefined'.
exit=2
```

(jumlah baris dipangkas; `skills`/`experience`/`education`/`format_ats` yang
diminta `tsc` dipangkas dari keluaran agar ringkas.)

Solusinya tipe baru di `types.ts`, bukan mengubah tipe yang dipakai halaman
live: `StoredBreakdown = Partial<NonNullable<AnalysisResult["breakdown"]>>` dan
`StoredAnalysisResult = Omit<AnalysisResult, "breakdown"> & { breakdown?: StoredBreakdown | null }`.
Halaman `[id]` memakai `StoredAnalysisResult`; `/checker/page.tsx` tetap memakai
`AnalysisResult` dan tidak berubah satu baris pun. Job panel HR berikutnya
hanya perlu tahu bentuk yang mana yang dipakai di halaman mana.

## Temuan 3 — entri kosong dibuang, bullet ISSUES hantu hilang

`toTextList()` dan `toIssueList()` sekarang menyaring entri yang teksnya kosong
atau cuma spasi (nilai yang lolos tetap verbatim, tidak di-`trim`). String issue
yang tidak kosong tetap tidak dibuang, sesuai temuan sebelumnya.

`relevance` sendiri tetap `""` kalau memang tidak ada — aman karena halaman
sekarang memakai `breakdown.education.relevance ? [breakdown.education.relevance] : []`.
Test mengunci ekspresi halaman itu lewat `toIssueItems()`, supaya bullet kosong
tidak bisa kembali diam-diam.

## Temuan 4 — sisanya dinormalkan, tidak dikecualikan

Tidak ada field yang dikecualikan; semuanya ikut normalisasi:

| Field | acolh lama | helpers baru |
|---|---|---|
| `scores.overall` dsb. | `?? 0` | `toScore(v, 0)` — hanya number finite |
| `aiFeedback.*` | `?? ""` | `toText(v)` — hanya string |
| `weightsApplied` | cast `as ...` | `toWeightsApplied()` — null kalau satu bobot hilang |
| `impactForecast` | cast `as ImpactForecast` | `toImpactForecast()` — null kalau satu angka hilang |
| `grade` | `?? null` | `toGrade()` — hanya A/B/C/D |
| `atsPrediction` | `?? null` | `toAtsPrediction()` — hanya tiga nilai yang dikenal |
| `aiModel` | diteruskan mentah | `toAiModel()` — hanya V4 Pro/V4 Flash |

Bobot dan proyeksi tidak diisi `0` kalau tidak ada: keduanya adalah penjelasan
hasil ("35% experience", "naik ke 90"), jadi angka nol akan mengarang klaim.
Keduanya jadi `null`, dan konsumennya sudah menampilkan sendiri saat `null`
(`ImpactForecastCard`, `weightsApplied && ...` di `/checker/page.tsx`).

`meta`, `careerVelocity`, dan `atsPredictionDetail` tetap diteruskan mentah.
Alasannya: seluruh field di dalamnya opsional di sisi Client dan tidak ada satu
pun yang dipakai sebagai angka — panel HR forthcoming yang menanganinya, dengan
fallback sendiri. `keywordAnalysis.match_rate_pct` tetap default `0` karena
nilainya dihitung sendiri oleh route analyze (bukan hasil jsonb AI), dan test
lama sudah mengunci `0`.

Baris baru diakhiri newline.

## Test yang dipecah / diperbarui

Test lama yang mengunci perilakukah yang salah **diperbarui**, bukan dipiha:

- "breakdown kosong menghasilkan lima section yang aman dibaca" → jadi
  "breakdown tanpa section tidak menghasilkan satu pun kartu" (`toBeNull()`).
- "section yang ada tetap utuh, section yang hilang diisi default" → jadi
  "section yang ada tetap utuh, section yang hilang tidak muncul" (`undefined`).
- "koleksi yang bukan array diabaikan" → `breakdown.summary` yang `"bukan objek"`
  kini `undefined`, bukan `{ score: 50, ... }`.
- "weightsApplied dan aiModel diteruskan" → dipecah jadi "aiModel dibaca dari
  hasil tersimpan", "baris lama tanpa aiModel jadi undefined", "aiModel di luar
  daftar model diabaikan", plus uji sumber route yang mengunci `aiModel` ada di
  dalam blok `aiStructuredData`.
- `baca_like halaman` diperbarui ke bentuk halaman yang sekarang (`?.` per
  section), persis tujuannya: jadi pengaman kalau akses halaman berubah lagi.

Test baru: section tanpa skor angka, entri kosong di issue/teks, `relevance`
kosong, normalisasi `scores`/`aiFeedback`, bobot tidak lengkap, proyeksi tidak
lengkap.

## Perintah dan output

### Test gagal dulu, untuk alasan yang benar

```
> npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot
  Test Files  1 failed (1)
       Tests  10 failed | 9 passed (19)
```

Alasan kegagalan (dipangkas):

```
> breakdown kosong menghasilkan lima section yang aman dibaca
AssertionError: expected { summary: { score: 50, …(2) }, …(4) } to be null

> section yang ada tetap utuh, section yang hilang diisi default
AssertionError: expected { score: 50, relevance: '', …(1) } to be undefined

> entri kosong dibuang dari daftar issue dan teks
AssertionError: expected [ '', '   ', 'Kurang metrik', …(2) ] to deeply equal [ 'Kurang metrik', …(1) ]

> skor, umpan balik, bobot, dan proyeksi dinormalkan
AssertionError: expected { overall: '80', …(3) } to deeply equal { overall: +0, keywordGap: 12.5, …(2) }
AssertionError: expected { role_category: 'tech', …(1) } to be null

> aiModel dibaca dari hasil tersimpan, bukan dari payload API
AssertionError: expected undefined to be 'V4 Pro'

> route analyze menyimpan aiModel di dalam full_result
AssertionError: expected 'const aiStructuredData = {…' to match /aiModel:/
```

`tsc` di saat yang sama juga gagal karena tipe baru belum ada:

```
> npx tsc --noEmit -p tsconfig.json
src/__tests__/checker-analysis-from-full-result.test.ts(5,50): error TS2724: '"@/components/checker/types"'
has no exported member named 'StoredAnalysisResult'. Did you mean 'AnalysisResult'?
exit=2
```

### Setelah perbaikan

```
> npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot
  Test Files  1 passed (1)
       Tests  19 passed (19)
```

```
> npx vitest run --reporter=dot
  Test Files  74 passed | 1 skipped (75)
       Tests  876 passed | 1 skipped (877)
    Duration  22.40s
exit=0
```

```
> npx tsc --noEmit -p tsconfig.json
exit=0
```

```
> npm run build
✓ Compiled successfully
exit=0
```

Lint untuk lima berkas yang diubah juga bersih (`npx eslint …`, exit=0).

## Kekhawatiran

- **Badge model baru muncul untuk baris baru saja.** Baris lama tidak punya
  `aiModel` di jsonb, jadi `/checker/[id]` tetap tanpa badge untuk hasil lama —
  lebih baik kosong daripada menampilkan model yang tidak diketahui.
- **`[id]/page.tsx` sekarang bisa menampilkan breakdown sebagian.** Untuk baris
  yang `breakdown`-nya terpotong, hanya section yang punya skor yang dirender.
  Ini perubahan tampilan yang disengaja, tapi kalau ada baris lama yang reliant
  pada kartu kosong tersebut, datanya memang tidak pernah ada.
- **`meta`/`careerVelocity`/`atsPredictionDetail` masih diteruskan tanpa validasi
  bentuk.** Tidak ada angka yang dipalsukan, tapi panel HR berikutnya tidak boleh
  mempercayai isinya tanpa `?.` — mapper bukan gerbang integritas data.
- **Uji sumber untuk `aiStructuredData`** (baca teks route) mengikuti pola yang
  sudah dipakai `checker-read-speed.test.ts`. Uji ini bisa gagalfalse-positive
  kalau nama variabel berubah; di sisi lain ia juga yang membuktikan field itu
  benar-benar ada di objek yang disimpan, bukan hanya di response.
- **`progress.md` dan berkas `.codex/`, `skills` tidak ikut di-commit** — sudah
  berubah sebelum task ini.
