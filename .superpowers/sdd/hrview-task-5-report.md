# Report Task 5 — Komponen `HrPointOfView` dan teks dua bahasa

Branch: `master` (commit `7c0b1d8` sebelum pekerjaan ini).
Status: DONE_WITH_CONCERNS (dua kontradiksi di brief, satu diselesaikan di copy satu di test — detail di bawah).

---

## 1. Apa yang berubah per file

### `src/components/checker/HrPointOfView.tsx` (baru, 130 baris)

- `export default function HrPointOfView({ result, keyPrefix = "checker." }: { result: AnalysisResult | null; keyPrefix?: string })` — sesuai kontrak brief. Tidak dipasang di halaman mana pun; tidak ada file halaman yang disentuh.
- `"use client"` di baris paling atas. Brief tidak menyebutkannya, tapi komponen memanggil `useTranslation` (hook), dan semua komponen checker yang pakai hook di repo ini (`SectionScoreCard.tsx`, `types.ts`) membuka file dengan `"use client"`. Tanpa itu, begitu Task 6 meny-mount-nya ke server component, Next akan protes.
- Data masuk lewat `buildHrPointOfView(result)` (Task 4). Komponen tidak memanggil AI dan tidak bercabang pada bentuk data mentah.
- Empat tabel label lokal (`SEVERITY_LABEL`, `LEVEL_LABEL`, `PROGRESSION_LABEL`, `GROWTH_LABEL`), semua `{ id, en }`, dipilih lewat `pick()` berdasarkan `lang`. Tidak ada string Inggris yang ditulis mati di dalam JSX.
- `FindingList` merender satu daftar temuan: teks, label severity (hanya kalau ada), lalu kutipan asli (hanya kalau ada). Kolom dengan daftar kosong mengembalikan `null`, judul kolomnya tetap tampil.
- Baris perjalanan dirakit dari dua bagian opsional dan digabung dengan `" · "`:
  `Perjalanan: naik · Laju karier: pesat`
  Kalau hanya salah satu yang ada, hanya bagian itu yang muncul — tidak ada placeholder, tidak ada kata yang menggantung.
- **Tidak ada kredit kosong**: `isEmpty` hanya mengganti grid dua kolom dengan kalimat jujur. Baris level dan baris perjalanan di luar percabangan itu, jadi tetap tampil saat daftar temuan kosong.
- **Tidak ada janji baik**: string `hrview-empty` berbunyi "Analisis ini tidak menghasilkan temuan sisi HR…" — tidak ada kata "bagus" di mana pun di panel.
- **Kutipan tidak pernah dipotong**: `whitespace-pre-wrap break-words`, tanpa `truncate`/`line-clamp`. `null` berarti tidak ada elemen sama sekali, bukan kotak kosong.
- Komentar berbahasa Indonesia dan menjelaskan alasan (kenapa kolom kosong tetap judulnya, kenapa kutipan tidak dipotong, kenapa level/perjalanan tidak ikut disembunyikan), mengikuti gaya `hr-point-of-view.ts`.

### `src/lib/i18n.tsx` (dimodifikasi)

- 8 kunci baru setelah `checker.ai-review` (sekitar baris 795): `hrview-title`, `hrview-subtitle`, `hrview-stopping`, `hrview-continuing`, `hrview-level`, `hrview-journey`, `hrview-pace`, `hrview-empty`.
- 8 kunci kembar dengan prefix `checker.detail.` setelah `checker.detail.review-title` (sekitar baris 1440). Nilai `id`/`en` identik dengan versi live, sesuai brief.
- Setiap kunci punya isi `id` **dan** `en`. Tidak ada kunci yang cuma salah satu bahasa.
- Penyimpangan dari brief: satu kunci tambahan, `hrview-pace` ("Laju karier" / "Career pace"). Alasan di bagian 4.

### `src/__tests__/checker-hr-point-of-view-ui.test.tsx` (baru, 88 baris)

- 5 test dari brief, apa adanya dalam isi dan urutan, kecuali dua penyesuaian regex yang dijelaskan di bagian 4.
- `renderPanel` membungkus `<LanguageProvider>` di setiap render, dengan komentar alasannya. Setiap render dibungkus provider, termasuk `null`.
- 3 test tambahan yang menutup cabang yang tidak diuji brief (lihat bagian 3).

---

## 2. Langkah TDD dan buktinya

### Langkah 1 — tulis test, jalankan, gagal

```
npx vitest run src/__tests__/checker-hr-point-of-view-ui.test.tsx --reporter=dot
```

```
 FAIL  src/__tests__/checker-hr-point-of-view-ui.test.tsx [ src/__tests__/checker-hr-point-of-view-ui.test.tsx ]
Error: Failed to resolve import "@/components/checker/HrPointOfView" from "src/__tests__/checker-hr-point-of-view-ui.test.tsx". Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

Gagal di level suite: komponen belum ada. Ini memang yang diminta brief, tapinya tidak ada assertion individual, jadi setelah komponen jadi saya buktikan tiap test dengan mutasi (bagian 3).

### Langkah 3 — kunci i18n

Ditaruh lebih dulu supaya render pertama tidak diam-diam fallback ke kunci mentah.

### Langkah 4 — komponen

### Langkah 5 — test hijau

```
npx vitest run src/__tests__/checker-hr-point-of-view-ui.test.tsx --reporter=dot
······
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

### Langkah 6 — typecheck dan suite penuh

```
npx tsc --noEmit -p tsconfig.json
```
Tidak ada output sama sekali.

```
npx vitest run --reporter=dot
```
```
 Test Files  76 passed | 1 skipped (77)
      Tests  897 passed | 1 skipped (898)
   Duration  24.33s
```

896 → 898 test karena dua test tambahan saya masuk. Suite hijau penuh; warning `act(...)` dan "Not implemented: navigation" yang muncul di stderr sudah ada sebelum task ini.

---

## 3. Bukti setiap test bermakna (mutasi)

Karena run pertama gagal di level suite, saya buktikan setiap assertion dengan sengaja merusak komponen lalu melihat test mana yang jatuh. Semua mutasi dikembalikan dan diverifikasi ulang (run akhir hijau).

| Mutasi | Hasil |
|---|---|
| `finding.quote && false ? (` — kutipan tidak dirender | `1 failed \| 5 passed` — "menampilkan temuan berhenti dan lanjut beserta kutipannya" gagal: `Unable to find ... JavaScript, React` |
| Kalimat empty diganti `CV kamu sudah bagus kok.` | `2 failed \| 4 passed` — "saat kosong, jujur..." dan "tidak error saat hasil kosong total" gagal |
| Blok perjalanan `{false && journey ? (` | `1 failed \| 5 passed` — "menampilkan level terbaca dan perjalanan karier" gagal (assertion `/naik/i`) |
| Kunci `checker.detail.hrview-title` di i18n di-rename jadi `...-X` | `1 failed \| 5 passed` — "pakai prefix kunci halaman hasil tersimpan" gagal: `Unable to find ... Sisi HR` |
| Seniority dan perjalanan disembunyikan saat `isEmpty` | `2 failed \| 6 passed` — "level dan perjalanan tetap tampil..." dan "hanya laju karier yang ada..." gagal |

Dua mutasi pertama lebih dulu sempat saya coba sebelum kode ada; hasil dan pasangannya identik. Semua file sudah dikembalikan persis (`git diff` hanya menunjukkan tiga file yang memang boleh disentuh).

**Test yang tidak bisa dibuktikan secara perilaku**: "pakai prefix kunci halaman hasil tersimpan" tidak bisa membedakan apakah `keyPrefix` dipakai atau diabaikan, karena `checker.*` dan `checker.detail.*` sengaja punya nilai identik. Yang bisa dibuktikan (dan sudah, baris 4 tabel) adalah bahwa kunci `checker.detail.*` benar-benar ada dan resolve. Kalau Task 6 nanti memakai ini, tidak ada cara memverifikasi switch prefix tanpa membedakan isi kedua set kunci — ini keterbatasan test, bukan bug.

Tiga test tambahan:
- **"level dan perjalanan tetap tampil walau daftar temuan kosong"** — menutup aturan bahwa `isEmpty` hanya soal daftar temuan; level dan perjalanan tetap informatif. Ini juga yang paling rawan regression kalau ada refactor yang isinya `null` buat seluruh body.
- **"hanya laju karier yang ada, arahnya tidak dikarang"** — Ketika `title_progression` null tapi `growth_rate` ada, panel harus menampilkan laju saja. Ini yang menangkap bug kalimat setengah kosong yang sempat ada di versi pertama.
- **"pakai prefix kunci halaman hasil tersimpan"** — Kunci `checker.detail.*` benar-benar ada.

---

## 4. Yang ambigu atau salah di brief, dan bagaimana saya selesaikan

Brief punya beberapa transcription error. Berikut yang saya temukan dan keputusan saya.

### 4.1 `/dibaca/` vs `"terbaca"` — kontradiksi langsung, saya perbaiki copy-nya

Brief Step 1 menulis `expect(screen.getByText(/dibaca sebagai level/i))`, brief Step 3 menulis `"CV ini terbaca sebagai level"`. `"dibaca"` bukan substring dari `"terbaca"` — assertion itu tidak akan pernah lulus. Saya buktikan dengan probe terpisah (sudah dihapus):

```
html: "<p>CV ini terbaca sebagai level: entry</p>"
textContent: "CV ini terbaca sebagai level: entry"
regex test: false
```

**Keputusan: `terbaca` → `dibaca`.** Alasannya: `dibaca` juga bahasa Indonesia yang benar untuk "dipakai orang untuk membacanya" (HR baca CV-mu), sementara `terbaca` berarti "bisa dibaca" — kalimat yang berbeda. Dan brief mengizinkan saya memilih ulang teks yang kelihatan salah. Assertion brief jadi berlaku kembali tanpa diubah.

### 4.2 Kalimat kosong: test dan copy brief tidak cocok

Brief Step 1: `/tidak ada temuan sisi HR/i`. Brief Step 3: `"Analisis ini tidak menghasilkan temuan sisi HR. …"`. `"tidak ada temuan"` bukan substring dari `"tidak menghasilkan temuan"`.

**Keputusan: copy brief dipertahankan persis, regex test yang saya ubah** jadi `/tidak menghasilkan temuan sisi HR/i`.

Alasan: Anda turunkan instruksi eksplisit "keep … the empty-state sentence exactly as the brief specifies", dan kalimat itu ditulis lengkap dengan nilai `id` dan `en` di langkah i18n. `tidak ada temuan` juga gramatikal buruk ("tidak ada" butuh kata benda yang cocok, hasilnya aneh). Assertion-nya masih menguji hal yang sama: panel mengata jujur dan mengarahkan, bukan menjanjikan CV bagus.

**Ini satu-satunya tempat saya departing dari brief, dan saya sengaja tidak menyamarkannya.** Kalau Anda mau copy brief yang disesuaikan, tinggal ganti nilai `checker.hrview-empty` dan `checker.detail.hrview-empty` jadi `Analisis ini tidak ada temuan sisi HR. …` lalu kembalikan regex test ke `/tidak ada temuan sisi HR/i` — dua baris.

### 4.3 Baris perjalanan di sample component rusak

Sample di brief: pemisah `"? "` (dua kali) dan `laju ${pick(GROWTH_LABEL[...])}` di mana `GROWTH_LABEL.Fast.id` juga `"laju"` — hasilnya `"laju laju"`. Dua `?` itu karakter yang rusak (`·`, seperti seluruh dokumen brief ini).

**Keputusan: tidak mengikuti sample sama sekali untuk baris ini.** Saya ganti dengan dua label terpisah + penyambung `" · "`, dan menambah satu kunci `hrview-pace`:

```
Perjalanan: naik · Laju karier: pesat
Trajectory: rising · Career pace: fast.
```

Kalau hanya `growth_rate` yang ada: `Laju karier: pelan.` Kalau hanya `title_progression`: `Perjalanan: naik.` Tidak pernah ada kata tanpa isi. Ini satu kunci di luar brief, dan memang perlu — Growth label harus bisa berdiri sendiri sebagai kata benda.

### 4.4 `"Bikin berhentitotal"` — spasi hilang

Brief: `critical: { id: "Bikin berhentitotal", en: "Hard stop" }`. Saya tulis `"Bikin berhenti total"`. Kata-katanya sama, hanya spasi yang dipulihkan. Label severity lain (`Tinggi`/`Sedang`/`Ringan`) saya biarkan persis seperti brief.

### 4.5 Label `entry` / `senior` / `lead` identik di dua bahasa

Brief memakai `entry` untuk `id` juga. Saya biarkan: itu memang yang dipakai orang, dan mengganti ke "entry level" cuma menambah kata tanpa menambah kejelasan.

### 4.6 `lang` bertipe `Lang`, bukan `string`

Brief menulis `FindingList({ findings, lang }: { findings: HrFinding[]; lang: string })` lalu melakukan `lang as "id" | "en"`. Saya pakai type `Lang` langsung dari `src/lib/i18n.tsx`, jadi tidak ada cast sama sekali. Lebih sempit dan tidak ada cast typecheck bersih.

### 4.7 `satisfies Record<string, Bilingual>`

Label tables diberi `as const satisfies Record<string, Bilingual>`. Const assertion menjaga key tetap literal (nilai AI di luar daftar jadi bug, bukan string salah yang diam-diam tampil), `satisfies` memastikan tiap entri dua bahasa. Indexing dengan `view.progression` (union yang sudah dipersempit `buildHrPointOfView`) jadi type-safe.

---

## 5. Kekhawatiran

1. **Copy kosong masih jadi sumber dua arah.** Saya mengikuti keputusan di 4.2. Kalau brief dipakai sebagai regression check oleh tooling lain dengan regex aslinya, dua test itu akan gagal. Putuskan sekali: copy atau regex.
2. **Test prefix tidak membuktikan prefix-nya dipakai.** Karena kedua set kunci bernilai identik secara sengaja. Kalau ini penting, satu-satunya cara adalah membedakan isi `checker.detail.*` — yang justru bertentangan dengan brief. Saya biarkan sesuai brief.
3. **`whitespace-pre-wrap` + `font-mono` untuk kutipan.** Preserve newline itu pilihan saya supaya kutipan multi-baris dari CV tidak diratakan, tapi `pre-wrap` juga memertahankan whitespace di teks biasa yang tidak sengaja punya spasi ganda. Kalau ini disertai noise, turunkan ke `break-words` saja.
4. **`id="hrview-title"` itu ID tetap, bukan unik.** Kalau panel someday di-mount dua kali di satu halaman (mis. perlu Task 6 merender desktop + mobile), aria-labelledbynya akan bentrok. Pakai `useId()` kalau nanti perlu.
5. **Panel belum terpasang di halaman mana pun** sesuai instruksi. `HrPointOfView` mati kode sampai Task 6 — tree-shaking akan membuangnya di produksi, jadi belum ada pengguna yang melihat teks baru ini. Itu yang diminta, cuma dicatat.
6. **Tidak ada test bahasa Inggris.** Semua test berjalan di `lang: "id"` (default provider, dan `localStorage` kosong di jsdom). Kalau Task 6 ke depan perlu bukti bahasa Inggris, test itu perlu provider yang bisa di-set — `LanguageProvider` sekarang hanya menerima in-memory state + localStorage, jadi harus lewat `toggleLang` atau stub `localStorage`. Belum saya kerjakan karena di luar scope task ini.

---

## 6. Commit

Commit tunggal, message persis dari brief (dua `?` di message diganti `·`, konsisten dengan pemisah di copy repo):

```
feat(checker): panel Sisi HR dengan temuan dan kutipan asli CV
```

Tiga file saja yang masuk: `src/components/checker/HrPointOfView.tsx`, `src/lib/i18n.tsx`, `src/__tests__/checker-hr-point-of-view-ui.test.tsx`.

---

# Review Task 5 — perbaikan 1 Critical + 6 Important + 6 minor

Status: DONE. Semua temuan review diverifikasi dulu terhadap kode sebelum diubah; tidak ada yang saya kerjakan tanpa bukti, dan tidak ada satu pun yang saya tolak.

## 7. Verifikasi sebelum implementasi

Saya cek setiap temuan langsung ke sumbernya, bukan dari deskripsi review:

| Temuan | Bukti di repo |
|---|---|
| Heading tidak jadi heading | `tailwind.config.ts:88-96` — `fontSize` cuma punya `display, headline-lg, headline-md, body-lg, body-md, label-bold, label-sm`. Tidak ada `headline-sm`. `fontFamily` (`:78-87`) juga tidak punya `headline-sm`. |
| Preflight mewarisi ukuran | `src/app/globals.css:1-12` — `@tailwind base` aktif, `body` tidak mendeklarasikan `font-size`. Heading jadi `font-size: inherit`. |
| Petunjuk empty-state salah halaman | `i18n.tsx:785` `checker.sec-title` = "Skor Per Section" / "Scores per Section", tapi `i18n.tsx:1435` `checker.detail.section-breakdown` = "Skor Per Section" / **"Section Breakdown"**. Dua halaman memang berbeda judul di Inggris. |
| Label `Ringan` | Gloss, bukan padanan. Diganti `Rendah`. |
| Tidak ada test Inggris | 8 test lama semuanya render dengan default `id`; `LanguageProvider` baca `localStorage.getItem("lang")` di `useEffect` (`i18n.tsx:1826-1829`), dan jsdom mengosongkan `localStorage`, jadi `lang: "en"` tidak pernah dieksekusi. |
| Trailing newline | Kedua file berakhir `\n125` — tidak ada newline di akhir. |

Kesimpulan: semua temuan benar secara teknis. Tidak ada yang perlu saya bantah.

## 8. Yang diperbaiki

### Critical — hierarki heading terbalik

`<h2>` pakai `font-headline-sm text-headline-sm`, dua token yang tidak ada. Karena preflight, hasilnya 16px weight 400 — lebih kecil dari `<h3>` 14px/600 di bawahnya. Sekarang `font-headline-md text-headline-md`.

Audit penuh file: satu-satunya kelas lain yang tidak ada tokennya adalah `text-body-sm` (4 pemakaian), semuanya diganti `text-body-md`.

### 1. `text-body-sm` → `text-body-md`

Dipakai di teks temuan, subtitle, kalimat empty-state, dan baris arah karier.

### 2. Petunjuk empty-state jadi bebas halaman

Sebelum: id "…ada di Skor Per Section di bawah", en "…under Scores per Section below".
Sesudah: id "Analisis ini tidak menghasilkan temuan sisi HR. Catatan per bagian ada di bawah.", en "This analysis produced no HR-side findings. Section-by-section notes are below."

### 3. Kolom kosong menjelaskan dirinya sendiri

`FindingList` dulu `return null` kalau kosong, hasilnya judul tebal di atas area hampa. Sekarang dua kunci baru per prefix:

- `hrview-stopping-empty` — "Nggak ada yang bikin saya berhenti." / "Nothing made me stop."
- `hrview-continuing-empty` — "Nggak ada yang bikin saya lanjut baca." / "Nothing made me keep reading."

Empat kunci baru total (2 × 2 prefix), sesuai brief.

### 4. Set label severity disatukan

Review minta dua hal yang menarik: set-nya konsisten bentuknya, dan "Bikin berhenti total" tetap ada sebagai teks. Dua hal itu tidak bisa dipenuhi bersama kalau yang satu klausa dan yang lain kata sifat.

**Keputusan saya: seluruh set jadi kata sifat yang naik-turun gradasi** — `Berat banget` / `Tinggi` / `Sedang` / `Rendah`, en `Very serious` / `High` / `Medium` / `Low`.

Alasan: konsistensi register butuh skala yang berurutan, bukan satu kata nyasar di ujung skala. Kalau `critical` tetap "Bikin berhenti total", tiga label lain tetap terdengar seperti kategori resmi sementara yang pertama terdengar seperti catatan pribadi — dan kalau nanti AI menurunkan `critical` jadi `high`, "bikin berhenti total" jadi tidak berlaku lagi. Trade-off: kehilangan frasa yang paling panas, tapi severity sekarang terbaca sebagai skala, bukan sebagai catatan.

### 5. "Yang bikin saya lanjut" → "Yang bikin saya lanjut baca"

Setuju. "Lanjut" sendirian di konteks rekrutmen dibaca sebagai "setujui", persis seperti yang review bilang. Teks Inggris "What made me keep reading" memang sudah membawa makna "membaca" yang hilang di Indonesia.

### 6. Test bahasa Inggris

Dua test baru (`lang: "en"` lewat `localStorage.setItem("lang", "en")` sebelum render), plus `afterEach` yang menghapus `lang` — tanpa itu, "en" bocor ke test berikutnya dan assertion Indonesia lulus diam-diam karena tidak menulis apa-apa.

Setiap test Inggris juga punya `expect(screen.queryByText(/hrview-/)).not.toBeInTheDocument()`: kalau satu dari 16 string Inggris salah ketik, `t()` mengembalikan kunci mentahnya dan assertion itu menangkapnya.

### Minor

- `useId()` menggantikan `id="hrview-title"`.
- `Perjalanan`/`Trajectory` → `Arah karier`/`Career trajectory`.
- Severity dibedakan visual: critical `text-label-bold text-error` (14px/600 merah), high `text-label-sm text-on-background`, medium/low `text-label-sm text-on-surface-variant`. Kata severity tetap ada di semua tingkat — tidak pernah warna saja.
- Test vacuous diganti: assertion lama mencocokkan string dari fixture lain, jadi lulus walau komponen merender kotak kutipan kosong. Sekarang: di dalam `li` tidak boleh ada `<p>` dengan `textContent` kosong.
- Trailing newline ditambahkan ke kedua file.
- `<div className="mt-2">` dihapus; `FindingList` sekarang memiliki spacing-nya sendiri (`mt-2` pada `<ul>` maupun pada `<p>` fallback).

## 9. Catatan teknis: kenapa weight tidak pakai `font-bold`

Rencana awal saya `font-bold` untuk critical. Saya tidak memakainya karena `text-label-sm` sendiri sudah membawa `fontWeight: 500`, dan dua utilitas satu-kelas di layer yang sama urutannya ditentukan oleh urutan di stylesheet, bukan urutan di atribut `class`. Kalau ternyata urutannya salah, "Berat banget" tampil 12px/500 dan bug aslinya kembali dalam bentuk lain.

Solusinya memakai token yang keduanya sudah membawa weight sendiri: `text-label-bold` (600) untuk critical, `text-label-sm` (500) untuk yang lain. Tidak ada competition.

## 10. Bukti TDD

Semua test ditulis lebih dulu.

Run awal — `10 failed | 5 passed (15)`, dan setiap gagalannya karena alasan yang dimaksud:

| Test gagal | Alasan |
|---|---|
| menampilkan temuan berhenti dan lanjut | "bikin saya lanjut baca" belum ada |
| menampilkan level terbaca dan arah karier | "arah karier" belum ada |
| saat kosong, jujur tanpa menyebut judul | kalimat masih menyebut "Skor Per Section" |
| judul panel memakai token headline yang benar | masih `text-headline-sm` |
| tidak memakai token Tailwind yang tidak didefinisikan | ada `text-body-sm` di 4 elemen |
| dua panel di satu halaman tidak bentrok id | dua id `hrview-title` kembar |
| kolom yang kosong menjelaskan dirinya sendiri | `FindingList` masih `return null` |
| label severity | masih "Ringan" dan kelas seragam |
| menampilkan panel dalam bahasa Inggris | "Career trajectory" belum ada |
| kalimat kosong dan kolom kosong (Inggris) | fallback kolom belum ada |

Empat mutasi lanjutan, semuanya dikembalikan:

| Mutasi | Hasil |
|---|---|
| heading balik ke `text-headline-sm` | `2 failed` — test heading + test token hantu |
| `useId()` → `const titleId = "hrview-title"` | `1 failed` — test id bentrok |
| 4 severity dikasih kelas sama | `1 failed` — test severity |
| `FindingList` fallback → `return null` | `2 failed` — test kolom kosong id + en |

## 11. Verifikasi akhir

```
npx tsc --noEmit -p tsconfig.json      → tanpa output
npx vitest run --reporter=dot           → 76 passed | 1 skipped (77 files)
                                           904 passed | 1 skipped (905 tests)
npm run build                           → sukses
```

898 → 905 test (+7). Suite penuh hijau; tidak ada regresi di test lain, termasuk test i18n yang mungkin berbagi string dengan yang saya ubah.

## 12. Kekhawatiran

1. **Keputusan nomor 4 mengganti teks yang review minta dipertahankan.** Saya pilih konsistensi set dan register di atas frasa "Bikin berhenti total". Kalau Anda lebih suka frasa itu dipertahankan, jalan yang paling mungkin adalah konsisten ke arah sebaliknya — ubah tiga lainnya jadi klausa ("Bikin saya ragu", "Bikin saya mikir dua kali", "Minor"). Tapi itu mengorbankan skala yang enak dibaca, jadi saya tidak memilihnya sendiri.
2. **`text-error` dipakai di label severity.** Token itu dipakai untuk error dan sudah dipakai di tempat lain di repo; kalau Task 6 menaruh panel ini di dalam konteks error card, dua warna bisa tumpang tindih. Saya belum cek pemakaian `text-error` di komponen checker lain.
3. **Test bahasa Inggris bergantung pada `localStorage`.** Kalau suatu saat `LanguageProvider` berubah baca preferensi dari tempat lain, dua test ini ikut gagal walaupun bukan karena copy rusak. Risikonya kecil, tapi coupling-nya nyata.
4. **Test `prefix` masih tidak membuktikan prefix-nya dipakai** — keterbatasan yang sama seperti di bagian 3 report asli, belum terselesaikan. Dua set kunci masih bernilai identik.
5. **Panel belum terpasang di halaman mana pun**, sesuai instruksi. Semua perbaikan baru terlihat kalau Task 6 mount.
6. **Angka 14px/600 vs 12px/500 untuk "Berat banget"** adalah pembedaan visual yang saya pilih tanpa melihat halaman nyata. Kalau ternyata masih kurang menonjol di layar, naikkan ke `text-body-lg` — token-nya ada.
