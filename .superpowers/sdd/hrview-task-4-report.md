# Task 4 Report — Fungsi murni `buildHrPointOfView`

Status: DONE_WITH_CONCERNS
Commit: `7c0b1d86c163018e7a81884b97cf16bc32eba4d3`
Branch: `master`

---

## 1. File yang berubah

### `src/lib/checker/hr-point-of-view.ts` (baru, 92 baris)

Fungsi murni tanpa dependensi runtime selain `import type`. Tidak ada panggilan AI,
tidak ada `fetch`, tidak ada React, tidak ada database.

Isi:
- `HrFinding`, `HrPointOfView` — interface persis seperti brief.
- Konstanta allow-list: `SEVERITIES`, `SENIORITIES`, `PROGRESSIONS`, `GROWTH_RATES`.
- `clean(value: unknown): string` — dari brief; hanya menerima string, memangkas
  spasi, dan hasil kosong berarti "tidak ada isi".
- `oneOf<T extends string>(value, allowed)` — helper baru untuk memfilter nilai
  enum. Brief menulis cek ini inline dua kali (`SEVERITIES.includes(...)`,
  `SENIORITIES.includes(...)`); saya jadikan satu helper karena sekarang ada
  empat allow-list yang butuh aturan sama. Perilaku identik.
- `buildHrPointOfView(result)` — penyusun view model.

Perbedaan dari cuplikan brief (semuanya disengaja,lihat bagian 4):
1. `risk_factors` dibaca dua bentuk (string polos atau objek), bukan hanya objek.
2. `risk_factors`/`strengths` dijaga `Array.isArray` sebelum `.map()`.
3. `title_progression` dan `growth_rate` divalidasi terhadap allow-list, bukan
   diteruskan apa adanya.
4. `type Severity` memakai `NonNullable<...>` supaya allow-list tidak bisa
   memuat `null` ( versi brief membolehkan `null` masuk ke `SEVERITIES[]` ).

### `src/__tests__/checker-hr-point-of-view.test.ts` (baru, 13 test)

10 test dari brief dipakai verbatim (nama, input, assertion tidak diubah), ditambah
3 test untuk kasus yang brief.sample code tangani salah — lihat bagian 3.

---

## 2. Perintah dan output

### RED #1 — modul belum ada

```
PS> npx vitest run src/__tests__/checker-hr-point-of-view.test.ts --reporter=dot
```

```
⎯⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯
 Test Files  1 failed (1)
      Tests  no tests
Error: Failed to resolve import "@/lib/checker/hr-point-of-view" from
"src/__tests__/checker-hr-point-of-view.test.ts". Does the file exist?
```

Gagal karena modul belum ada — alasan yang benar, bukan salah ketik.

### GREEN — implementasi pertama

```
PS> npx vitest run src/__tests__/checker-hr-point-of-view.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  13 passed (13)
```

### RED #2 — bukti tiap test tambahan benar-benar bermakna

Agar tidak ada test yang "hijau karena tidak menguji apa-apa", implementasi brief
saya tulis ulang secara literal ke file yang sama, lalu jalankan suite yang sama:

```
PS> npx vitest run src/__tests__/checker-hr-point-of-view.test.ts --reporter=dot
⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  ... > risk_factors berupa string polos tetap terbaca
 FAIL  ... > nilai meta dan careerVelocity di luar daftar tidak diteruskan apa adanya
 FAIL  ... > atsPredictionDetail dengan bentuk asing tetap aman
 Test Files  1 failed (1)
      Tests  3 failed | 10 passed (13)
```

Artinya: 10 test brief lulus pada kode brief (konsisten), dan tepat 3 test tambahan
yang saya tulis gagal pada kode brief — masing-masing karena satu bug nyata yang
dijelaskan di bagian 3. Tidak ada test tambahan yang lolos sia-sia.

Implementasi final kemudian dipulihkan (backup di
`%TEMP%\opencode\hrview-impl-backup.ts`, dihapus setelah dipulihkan).

### Typecheck

```
PS> npx tsc --noEmit -p tsconfig.json
(tidak ada output)
```

Catatan: versi pertama gagal dengan 3 error (`TS2345`, `TS2322`, `TS2677`) karena
`map()` tanpa anotasi return membuat TS menyimpulkan `severity: null` literal dan
menolak type predicate. Diperbaiki dengan anotasi `: HrFinding | null` pada kedua
callback `map`. Jalankan ulang: bersih.

### Suite penuh

```
PS> npx vitest run --reporter=dot
 Test Files  75 passed | 1 skipped (76)
      Tests  889 passed | 1 skipped (890)
   Duration  26.89s
```

### Commit

```
[master 7c0b1d8] feat(checker): rakit pandangan sisi HR dari data analisis yang sudah ada
 2 files changed, 236 insertions(+)
```

`git status` setelah commit: hanya `progress.md` yang sudah termodifikasi sebelum
tugas ini dan file brief/report yang untracked — tidak ada file lain dari tugas ini
yang tertinggal.

---

## 3. Test tambahan yang saya tulis (3)

Semuanya Persis kasus yang Anda tandai sebagai "dapat membuat panel render kosong".

**a. `risk_factors berupa string polos tetap terbaca`**

Input `risk_factors: ["Kurang TypeScript", { text: "Tidak ada metrik", severity: "medium", source_excerpt: null }]`,
harapan dua finding. Ini kasus `IssueArr()`/`IssueOrString()` di
`src/lib/ai/prompts/schemas.ts:15-24`, yang memang mengizinkan union string|objek,
dan `src/__tests__/prompt-schemas.test.ts` sudah memasok
`risk_factors: ["Kurang TypeScript"]`. Kode brief gagal di sini: `clean(item?.text)`
pada `"Kurang TypeScript".text` adalah `undefined`, jadi baris pertama hilang diam-diam
dan panel menampilkan kurang satu risiko.

**b. `nilai meta dan careerVelocity di luar daftar tidak diteruskan apa adanya`**

Input `detected_seniority: "principal"`, `title_progression: "Naik Cepat"`,
`growth_rate: "Laju"`, ketiganya harus jadi `null`. Kode brief sudah benar soal
seniority (ada `SENIORITIES.includes`) tapi meneruskan
`title_progression`/`growth_rate` apa adanya lewat `?? null`. Karena
`analysisFromFullResult` meneruskan `meta`/`careerVelocity` dari jsonb tanpa
validasi (`src/lib/checker/analysis-from-full-result.ts:280-282`), nilai ini bisa
apa saja di runtime — termasuk tidak ada sama sekali (`undefined`, ditangani `?? null`
dengan benar). Nilai asing akan dirender mentah oleh komponen.

**c. `atsPredictionDetail dengan bentuk asing tetap aman`**

Input `{ risk_factors: "bukan array", strengths: null }`. Kode brief melakukan
`(detail?.risk_factors ?? []).map(...)`, dan string `"bukan array".map` adalah
`TypeError` — komponen crash, bukan panel kosong. `Array.isArray` mengubahnya jadi
panel kosong.

Saya tidak menambah test keempat karena brief dan instruksi sudah menyepakati: ketika
`ats_prediction` berupa string, `atsPredictionDetail` memang tidak ada sama sekali,
dan itu sudah tercakup test `ats_prediction berupa string tidak bikin error`.

---

## 4. Ambiguitas brief dan cara saya menyelesaikannya

**Jumlah test.** Brief menulis "Expected: PASS (10 test)", tapi instruksi Anda meminta
saya menangani string-union pada `risk_factors`, yang tidak punya test di brief dan
tidak akan tertangkap implementasinya. Saya perlakukan instruksi Anda sebagai yang
lebih tinggi dan menambah 3 test (13 total). Nama, isi, dan assertion 10 test brief
tidak saya sentuh sama sekali.

**Kode brief versus kode final.** Cuplikan di Step 3 adalah acuan *nilai* (union type,
nilai enum, nama field), bukan acuan *perilaku*. Saya mengambil semua nilai persis dari
brief dan mempertahankan setiap nama interface/field konstanta yang sama. Yang berubah
hanya penanganan input yang brief sendiri tidak benar, plus dua hal yang bersifat
konsistensi (helper `oneOf`, `NonNullable<Severity>`).

**`meta` "bisa bentuk apa saja".** Instruksi menyebut `meta` diteruskan tanpa validasi.
Saya tidak menambahkan penjaga untuk `meta` itu sendiri (`meta?.detected_seniority`
sudah aman untuk `null`/string/angka, dan `oneOf` menutup kasus sisanya). Yang
ditambahkan penjaganya adalah `Array.isArray` untuk dua array, karena di sanalah
`.map` benar-benar melempar.

**`isEmpty` hanya bergantung pada temuan.** Brief dan instruksi sudah pasti: `isEmpty`
= `stopping.length === 0 && continuing.length === 0`. Jadi hasil yang punya
`seniority`/`progression` tapi nol temuan tetap `isEmpty: true`. Itu disengaja —
`isEmpty` berarti "tidak ada temuan", bukan "tidak ada data sama sekali".

---

## 5. Kekhawatiran

**1. `severity` pada `continuing` selalu `null`, bahkan kalau AI mengirimnya.**
Kode brief sudah begitu dan saya pertahankan, tapi perlu dicatat untuk Task 5 (komponen):
`StrengthOrString` di schema memang tidak punya field `severity`, jadi praktis ini
tidak akan pernah terjadi. Kalau nanti produk ingin membedakan "strength kuat" dari
"strength lemah", itu perubahan schema dulu, bukan perubahan fungsi ini.

**2. Kutipan di-trim, jadi verbatim-ness bisa berubah.** `clean()` memakai `.trim()`,
jadi kutipan `" JavaScript, React "` menjadi `"JavaScript, React"`. Ini mengikuti brief.
Masalahnya kecil tapi nyata: `src/lib/ai/prompts/analysis-v3.ts:208`/snippet v4
menyebutkan `source_excerpt` dipakai untuk text-matching otomatis di UI. Kalau
Task 5 (atau task lain) membandingkan kutipan dengan teks CV secara literal, spasi
tambahan hasil trim bisa membuat perbandingan gagal. Pertimbangkan menyimpan
`source_excerpt` mentah dan hanya memakai bentuk trimmed untuk 판단 "ada atau tidak".
Saya tidak melakukannya di sini karena brief menetapkan `quote` sebagai hasil `clean()`.

**3. Tidak ada pelarutan `ats_prediction.result` dan `match_confidence`.** Keduanya ada
di `atsPredictionDetail` tapi tidak masuk `HrPointOfView`. Saya tidak menambahkan
karena interface di brief tidak menyediakannya, dan menambah field berarti deviasi dari
spec. Kalau panel nanti mau menampilkan "Likely Pass · 82% confident", itu perubahan
interface — perlu dikonfirmasi lebih dulu, bukan diam-diam ditambahkan.

**4. `progression`/`growth_rate` sekarang bisa `null` padahal nilainya selalu ada di
jalur live.** Di jalur analisis live, `z.enum(...).catch("Stable")` di
`schemas.ts:122-124` menjamin nilainya selalu salah satu dari enum. Jadi tambahan
validasi ini tidak mengubah apa pun untuk hasil live — ia hanya mencegah jsonb lama
atau rusak merender `"Naik Cepat"` mentah ke layar. Kalau nanti ada komponen yang
bergantung pada `progression` selalu non-null, itu asumsi yang salah dan lebih baik
ketahuan sekarang.

**5. `stopping`/`continuing` tidak diurutkan berdasarkan severity.** Brief tidak
meminta sorting dan tidak ada test untuk itu. Kalau panel HR ingin menampilkan
`critical` di atas, itu Task 5 atau task lanjutan — bukan saya tambahkan di sini
karena akan mengubah urutan yang dijamin test brief (`toEqual` bersifat order-sensitive).

**6. `.superpowers/sdd/progress.md` masih modified** dari pekerjaan sebelumnya dan
tidak saya sentuh — di luar scope tugas ini dan tidak ikut dalam commit.
