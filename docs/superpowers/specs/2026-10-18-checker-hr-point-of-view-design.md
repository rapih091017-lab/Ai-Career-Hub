# POV HR di Hasil Checker

Tanggal: 2026-10-18
Status: disetujui, siap ditulis jadi rencana kerja

## Masalahnya

Orang buka `/checker` untuk satu pertanyaan: *"CV-ku kep-view nggak sama HR?"*

Balasan yang mereka dapat sekarang berupa angka: skor 72, grade B, 5 section,
7 keyword hilang. Angka itu benar, tapi itu bahasa mesin. Yang mereka cari
banget bukan angka — mereka cari **reaksi**. Bekas mana yang bikin HR berhenti
baca, kalimat mana yang bikin dia lanjut.

Jalur Samping (jalursamping.com/cek-karir/) menjawabnya dengan "Cerita 6 Detik HR"
dan kutipan langsung dari CV. Itu yang bikin orang merasa dimengerti.

## Kabar baiknya: datanya sudah ada

Ini bukan fitur yang butuh bikin AI baru. AI kita **udah ngembalain** everything
yang dibutuhin, cuma gabun pernah masuk layar:

| Data | Status sekarang |
| --- | --- |
| `ats_prediction.risk_factors` (teks + severity + kutipan CV) | ada, tidak pernah dirender |
| `ats_prediction.strengths` (teks + kutipan CV) | ada, tidak pernah dirender |
| `meta.detected_seniority` | ada, malah **dibuang** di route |
| `career_velocity.title_progression` + `growth_rate` | ada, tidak pernah dirender |

Dan yang paling penting: **prompt udah nyatin kutipannya verbatim.**
`analysis-v4.ts:46` — "source_excerpt yang tidak null WAJIB substring PERSIS
(verbatim, termasuk typo)", diulang lagi di `:204` sebagai checklist. Jadi
kutipan di panel ini **pasti** kalimat asli dari CV orang itu. Tidak ada risiko
kutipan dikarang.

Artinya: nol prompt baru, nol token baru, nol schema baru.

## Yang dibangun

### Panel "Sisi HR"

Posisi: **pertama**, sebelum skor. Alasannya sederhana — ini pertanyaan yang
bikin orang buka halaman, jadi jawabannya harus muncul duluan.

Tiga bagian:

**1. Strip konteks.** Satu baris: `CV ini terbaca sebagai level: entry`. Bantu
pembaca tahu penilaiannya masuk akal buat posisinya atau nggak.

**2. Dua kolom.**

| Yang bikin saya berhenti | Yang bikin saya lanjut |
| --- | --- |
| "TypeScript tidak ada, muncul 6x di JD sebagai hard requirement" · **Kritis** | "Ada 3 proyek dengan metrik dampak" |
| `JavaScript, React, CSS` ← kutipan asli | `Bangun dashboard internal untuk 40 user` ← kutipan asli |

Kolom kiri dari `risk_factors`, kolom kanan dari `strengths`. Tiap butir bawa
severity dan kutipan verbatim-nya.

**3. Baris perjalanan karier.** "Perjalanan: stabil · laju normal" dari
`career_velocity.title_progression` + `growth_rate`.

### Yang sengaja ditunda

`section_order_recommendation`, `semantic_matched`, `career_velocity.recommendations`
— datanya ada, tapi kalau semuanya ditampung jadi satu panel, panelnya berubah
jadi tumpukan data dan kehilangan hierarki. Bisa jadi bagian sendiri nanti.

## Cara membangunnya

Tiga unit, satu tanggung jawab masing-masing.

**1. `src/lib/checker/hr-point-of-view.ts`** — fungsi murni, tanpa React, tanpa AI.

```
buildHrPointOfView(analysis) → {
  seniority:  { level } | null,
  stopping:   [{ text, severity, quote }],
  continuing: [{ text, quote }],
  trajectory: { progression, rate } | null,
  isEmpty:    boolean
}
```

Tugas utamanya satu: **`strengths` di schema itu campur bentuk** — bisa string
biasa, bisa `{ text, source_excerpt }`. Fungsi ini merapikannya jadi satu bentuk
selalu, biar komponen nggak pernah bercabang. Karena murni, seluruh logikanya
bisa diuji tanpa browser.

**2. `src/components/checker/HrPointOfView.tsx`** — tampilan doang, dipakai berdua
oleh `/checker` dan `/checker/[id]`.

**3. `analyze/route.ts`** — terusin `meta` ke respons **dan** ke `full_result`.
Sekarang dibuang di baris 275-290, padahal `detected_seniority`-nya ada di sana.

### Pemangkasan "Review oleh AI"

Kolom Kelebihan dan Perlu Diperbaiki dihapus dari bagian itu — isinya udah ada
di panel atas, jadi tampil dua kali. Sisa: `overall_assessment` dan
Rekomendasi ATS. Judul bagian nggak diubah.

## Dua cacat yang ikut dibenerin

Keduanya ketemu pas menelusuri, keduanya muncul di layar yang sama.

### 1. Grade bisa salah

`analysis-v4.ts:45` dan `:201` nyuruh AI ikutin "tabel GRADE", tapi tabel itu
**nggak ada** di filenya. Ambangnya cuma ada di `analysis-v3.ts` yang udah mati.
Artinya AI nebak sendiri grade yang ditampilin ke pengguna.

Perbaikan: tambahin tabel threshold ke `analysis-v4.ts` dengan angka yang sama
persis sama kayak v3 — 85-100 A, 70-84 B, 50-69 C, 0-49 D — supaya hasil lama
nggak berubah artinya.

### 2. `{{JD_TEXT}}` terkirim kosong

`adapter.ts:96` nyari penanda `"=== JOB DESCRIPTION ==="`, sementara route-nya nulis
`"=== JOB DESCRIPTION TARGET ==="` (route:206). Result-nya `indexOf` mengembalikan
-1, jadi `{{CV_TEXT}}` diisi seluruh user prompt (termasuk JD-nya) dan
`{{JD_TEXT}}` kosong.

JD tetep nyampe lewat pesan `user`, jadi hasil analysanya nggak rusaktotal — tapi
pemisahan CV vs JD yang diminta prompt nggak jalan, dan isi JD bisa kebaca
sebagai isi CV.

Perbaikannya **bukan** ganti konstanta di adapter, karena adapter dipakai bareng.
Penandanya dipindah ke `src/lib/ai/prompts/shared.ts`, lalu dipakai **kedua**
sisinya. `injectInputData` juga menerima beberapa penanda sekaligus, biar
pemanggil lain nggak ikut kena.

## Edge case

| Kondisi | Yang dilakukan |
| --- | --- |
| `risk_factors` **dan** `strengths` kosong | Status jujur: analisis ini nggak ngasih temuan sisi HR, terus arahin ke Skor Per Section. **Nggak** nulis "CV-mu udah bagus" |
| `source_excerpt` null | Kutipan nggak dirender. Kotak kosong lebih parah daripada nggak ada |
| Kutipan panjang | Ditampilin penuh, dipotong? **Nggak.** Kutipan kepotong = kutipan salah |
| `ats_prediction` berupa string | Panel kosong → status jujur. Nggak boleh error |
| Hasil lama tanpa `meta` | Baris seniority nggak muncul. Nggak boleh error |
| `career_velocity` nggak ada | Baris perjalanan nggak muncul |

Soal status jujur itu: kita nggak bisa bedain "memang nggak ada temuan" dari
"AI nggak ngeluarin apa-apa". Beda dua-duanya berarti kita ngarang kebagusan —
dan itu klaim tanpa bukti. Jadi kalimatnya jujur, bukan.

Nggak ada migrasi database. `meta` masuk ke `full_result` yang jsonb-nya udah ada.

## Cara ngetes

- Unit `buildHrPointOfView` — dua bentuk `strengths`, deteksi kosong, `meta` dan
  `career_velocity` absen, `ats_prediction` string, kutipan `null`
- Unit `injectInputData` — memecah bener di penanda yang dipakai route, dan tetep
  nerima penanda lama
- Prompt beneran nyertain tabel GRADE
- **Uji kontrak**: route dan adapter ngimpor penanda dari tempat yang sama. Ini
  yang cegah drift yang sama terulang — tes ini bakal nangkap cacat #2 dari awal
- Render test — temuan sama kutipan tampil, status jujur tampil saat kosong,
  seniority absen nggak bikin error
- Full suite + tsc + build

## Di luar scope

- Judul "Keyword Analysis" yang masih hardcoded bahasa Inggris — nyata ada,
  tapi perbaikan terpisah
- Download PDF untuk hasil checker — infrastrukturnya udah siap (ada `resultsRef`,
  ada `PdfExportButton`, ada `pdf-export.ts`), tombolnya belum dirender. Bukan
  bagian spec ini
- Quiz seperti punya Jalur Samping. Checker kita udah dikasih deskripsi lowongan,
  jadi datanya jauh lebih kaya daripada CV + jawaban kuis. Meniru model mereka
  justru kita mundur

## Nada teks

Teks panel ini ngomong kayak HR beneran yang lagi jelasin ke temuannya — bukan
seperti sistem. "Yang bikin saya berhenti", bukan "Temuan negatif terdeteksi".
Tetap hormat dan jujur, tapi to the point.

Yang dilarang: angka yang belum ada buktinya, klaim ne., dan kalimat yang
kedengeran kayak templat.