# PRD — Perombakan Builder CV (`/builder/[id]`)

Status: siap-agent (keputusan K1–K3 sudah dijawab user, 2026-10-30)

Dokumen ini adalah hasil audit kode builder CV + rencana eksekusi bertahap.
Eksekusi dikerjakan per issue di `issues/`, urut nomor. Setiap issue berdiri sendiri
(bisa di-commit dan di-review terpisah).

---

## 1. Ringkasan permintaan user (dipetakan ke issue)

| # | Permintaan | Issue |
|---|-----------|-------|
| 1 | Jarak nama ke bagian bawahnya (dan margin umum) di PDF beda dengan preview | 04 |
| 2 | Susun urutan section pakai drag and drop | 07 |
| 3 | Kolom input bisa pakai bullet | 05 |
| 4 | Hasil saran AI / Optimalkan otomatis jadi bullet | 06 |
| 5 | Level skill (Beginner/Intermediate/Advanced) tidak muncul di CV | 02 |
| 6 | Pengaturan font/justify per bagian, tidak global semua | 09 |
| 7 | Edit blok langsung di preview (preview = editor real time) | 10 |
| 8 | Pilih template di toolbar editorial | 08 |
| 9 | Drag and drop / hapus garis pemisah (divider) | 07 |
| 10 | Tombol "Optimalkan" masih tampil teks "rk" → hapus | 01 |
| 11 | Ikon bintang di pojok input: jelaskan itu apa | 12 |
| 12 | Arahkan isi Target Pekerjaan dulu di awal | 03 |
| 13 | Skill sudah diisi tapi tidak tampil di preview & PDF | 02 |
| 14 | Section opsional tidak bisa dihapus | 07 |
| 15 | Panduan untuk tiap fitur supaya orang awam tidak bingung | 12 |
| 16 | Panel input bisa diperlebar/dipersempit (tarik) | 11 |
| 17 | PDF harus 100% sama dengan preview | 04 |
| 18 | Perjelas "Lainnya" itu apa + contoh | 12 |
| 19 | Review maksimal di akhir | 13 |

Issue 00 (fondasi data) tidak diminta langsung, tapi wajib karena beberapa fitur di atas
butuh tempat simpan yang benar.

---

## 2. Temuan audit (akar masalah)

Semua path relatif ke root repo.

### A. Preview dan PDF memakai dua renderer berbeda → tidak mungkin 100% sama
- Preview: `AtsBaseRenderer` di `src/components/cv-templates/index.tsx` (HTML/React).
- PDF: `CvPdfDocument` di `src/lib/pdf/CvPdfDocument.tsx` (`@react-pdf/renderer`), dipanggil dari
  `downloadCvPdf` (`src/lib/pdf/generate-cv-pdf.ts`) di `src/app/builder/[id]/page.tsx:145`.
- **Satuan berbeda.** Di HTML, angka seperti `fontSize: 11`, `marginBottom: 25` dibaca sebagai **px**.
  Di react-pdf angka yang sama dibaca sebagai **pt** (1pt = 1,333px). Jadi semua teks dan jarak di PDF
  ±33% lebih besar daripada preview. Inilah penyebab "jarak nama ke bawahnya kelebihan" di PDF:
  `header marginBottom: 25` (18,75pt di preview vs 25pt di PDF), nama `bodySize*2.2` px vs pt, dst.
  Komentar `TemplateStyle.bodySize` bilang "pt", tapi preview merendernya sebagai px.
- **Font berbeda.** `toPdfFont()` memetakan semua font ke Helvetica/Times-Roman. Preview pakai
  Inter/Plus Jakarta Sans/Roboto/Calibri. Lebar huruf beda → baris pecah di tempat berbeda → jumlah halaman beda.
- **Pemenggalan halaman berbeda.** Preview = satu kertas panjang dengan garis putus-putus setiap
  `contentAreaMm`; tidak ada margin atas/bawah per halaman. PDF punya padding di tiap halaman.
- Fitur preview yang tidak ada padanannya di react-pdf: `border-radius`, `background` pada achievement, dsb.

### B. Level skill tidak pernah dirender
- `SkillEntry.level` dipilih di `src/components/builder/SkillSection.tsx`, tapi `AtsBaseRenderer`
  (bagian `skills`) dan `CvPdfDocument` hanya menulis `s.name`.

### C. Skill/section bisa tidak tampil
Kandidat penyebab (harus direproduksi dulu di issue 02):
1. `sectionOrder` dan `sectionVisibility` disimpan di **localStorage** (`src/hooks/useBuilderFormat.ts`).
   Data lama/korup di browser user (mis. `skills` hilang dari `sectionOrder`, atau `skills:false`) membuat
   section tidak dirender, tanpa ada UI yang menjelaskan.
2. `selfEvaluation` tidak ada di `DEFAULT_SECTION_ORDER` → Evaluasi Diri **tidak pernah** tampil di CV.
3. Sertifikasi hanya dirender di dalam blok `skills` → kalau skill kosong, sertifikasi ikut hilang.
4. Skill dengan nama kosong tetap memunculkan judul kategori kosong.

### D. Pengaturan tampilan tidak tersimpan di server
`useBuilderFormat` menyimpan font, ukuran, rata teks, urutan section, visibilitas, warna, margin,
**dan isi section "Lainnya"** hanya di `localStorage` (`cv_fmt_<id>`). Ganti browser/perangkat = hilang.
Isi "Lainnya" adalah konten CV, bukan preferensi — ini kehilangan data.

### E. Tombol "Simpan" manual tidak menyimpan apa pun
`handleSave` (`src/app/builder/[id]/page.tsx:180`) mengirim `body: JSON.stringify(cvData)`, padahal
`PUT /api/cv-documents/[id]` hanya membaca `body.tailoredContent` dan `body.templateId`.
Hasilnya: request sukses, toast "tersimpan", tapi tidak ada yang berubah. (Autosave di `useAutoSave`
sudah benar karena membungkus `{ tailoredContent }`.)

### F. Teks "rk" di tombol Optimalkan
`WorkCard.tsx:327` dan `SummarySection.tsx:269` memakai ikon `"spark"`. Nama ini tidak ada di font
Material Symbols yang dimuat, jadi tampil sebagai teks "spark" yang terpotong di kotak 14px → terlihat "rk".

### G. Ikon bintang (`auto_awesome`) di pojok input tanpa penjelasan
`AIPolishButton` (`src/components/ai/AIPolishDialog.tsx`) hanya ikon + `title` (tooltip native yang tidak
muncul di HP). Saat diklik, teks **langsung diganti** tanpa pratinjau dan tanpa undo.

### H. Target pekerjaan bukan langkah pertama
Urutan stepper: Data Diri → Target → ... Padahal semua tombol AI memakai `jobTitle`/`jobDescription`.
Tidak ada arahan bila target kosong.

### I. Section opsional tidak bisa dihapus
Organisasi, Evaluasi Diri, Sertifikasi, Lainnya selalu ada di form. Yang ada hanya toggle visibilitas
di modal Pengaturan Tampilan, tidak mudah ditemukan.

### J. Hal lain yang ditemukan
- Urutan section hanya via tombol panah di `SectionOrderModal`. `@dnd-kit/*` sudah ada di dependency
  (dipakai tracker) → drag and drop tidak butuh dependency baru.
- Pilih template hanya ada di dashboard/my-resumes (`TemplatePicker`), tidak di builder.
  `TEMPLATE_STYLES` punya 5 gaya.
- Panel kiri/kanan dikunci `lg:w-1/2`.
- Deskripsi kerja/organisasi = textarea polos; bullet ditentukan oleh "satu baris = satu poin" yang
  tidak terlihat oleh user.
- `/api/ai/polish`, suggest, revise mengembalikan teks bebas; tidak ada normalisasi ke baris bullet.
- "Lainnya" disimpan sebagai `customSections[id="lainnya"]` dengan judul tetap "Lainnya" di CV.
- Preview diskala `scale-[0.85]` di bawah `lg` tanpa mengubah ukuran layout → ada ruang kosong.

---

## 3. Keputusan (sudah dijawab user 2026-10-30)

- **K1 → Opsi A**, download PDF dari builder **bebas kuota**.
- **K2 → antislop dijalankan selama pengerjaan** (tiap issue yang menyentuh UI/copy/komentar).
- **K3 → level skill default disembunyikan**, toggle "Tampilkan level keahlian".
- Arahan umum user: jangan terpaku pada daftar permintaan. Bug atau hal yang kurang pas yang
  ditemukan selama pengerjaan dilaporkan ke user (dan dicatat di Comments issue terkait),
  lalu diperbaiki bila masih dalam lingkup builder.

Catatan pilihan semula di bawah dipertahankan sebagai konteks.

### K1. Cara membuat PDF supaya 100% sama dengan preview (issue 04)
Rekomendasi: **Opsi A**.

- **Opsi A — HTML jadi satu-satunya sumber, PDF dicetak Chromium di server (rekomendasi).**
  Preview dipaginasi sendiri di browser (halaman A4 nyata, bukan satu kertas panjang). Saat download,
  HTML halaman-halaman yang sama dikirim ke `POST /api/export-pdf-v2` (sudah ada, dipakai checker,
  surat lamaran, portfolio). Teks tetap bisa diseleksi & dibaca ATS. Paritas visual praktis 1:1 karena
  mesin render sama (Chromium) dan font sama.
  Konsekuensi: route ini memeriksa kuota `pdf_export` (gratis 2x/bulan) — sekarang builder **tidak**
  memotong kuota. Perlu diputuskan: builder ikut kuota, atau dibebaskan.
  Ada cold start ±beberapa detik pada request pertama.
- **Opsi B — Cetak lewat dialog print browser (`window.print`) dari iframe halaman yang sama.**
  Gratis, tanpa server. Tapi hasil bergantung browser user (Safari/Firefox beda), muncul dialog print,
  dan user bisa salah setting (header/footer browser, skala). Tidak bisa dijamin 100%.
- **Opsi C — Tetap react-pdf, samakan satuan & font.** Paling murah, tapi tetap dua renderer; selisih
  pemenggalan baris pasti terjadi. Tidak memenuhi "100% sama". Tidak direkomendasikan.

### K2. Kapan antislop dijalankan (wajib ditanya menurut `AGENTS.md`)
Selama pengerjaan, atau sesudah semua selesai? Rekomendasi: **selama** (copy & UI baru banyak; lebih
murah dibetulkan saat ditulis).

### K3. Level skill di CV ditulis bagaimana
Rekomendasi: default **tidak** menampilkan level (konvensi CV ATS), dengan toggle "Tampilkan level
keahlian" di Pengaturan Tampilan. Format bila aktif: `React (Mahir), Figma (Menengah)` — teks polos, bukan
bar/bintang (bar tidak terbaca ATS). Label mengikuti `cvLang`: Pemula/Menengah/Mahir atau
Beginner/Intermediate/Advanced.
Catatan: user melaporkan "ada opsi intermediate tapi di CV tidak ada" → kalau user ingin selalu tampil,
ganti default jadi aktif.

---

## 4. Prinsip teknis (berlaku untuk semua issue)

- Baca `node_modules/next/dist/docs/` yang relevan sebelum menulis kode Next (lihat `AGENTS.md`).
- Tanpa dependency baru. `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` sudah tersedia.
- Teks UI dan komentar kode dalam Bahasa Indonesia. String builder lewat `t()` di `src/lib/i18n.tsx`
  bila file terkait sudah memakai `t()`.
- Tanpa migrasi DB. Data baru masuk ke jsonb `cv_documents.tailored_content` (lihat issue 00).
- Data lama harus tampil persis seperti sebelumnya kecuali bug yang memang diperbaiki
  (mis. ukuran px→pt di issue 04 akan sengaja mengubah tampilan preview agar sama dengan PDF;
  ini dicatat di changelog commit).
- Satu sumber kebenaran untuk tampilan CV: `AtsBaseRenderer` (atau penggantinya). Komponen lain
  (preview, PDF, thumbnail) memakai renderer itu.
- Semua output AI yang masuk ke field list (deskripsi kerja, organisasi, Lainnya) dinormalisasi jadi
  satu poin per baris, tanpa karakter bullet di awal baris (renderer yang menambahkan bullet).
- Aksesibilitas: drag and drop wajib punya alternatif keyboard (dnd-kit `KeyboardSensor`) dan tombol
  panah tetap ada untuk pembaca layar. Target sentuh ≥ 44px.
- Mobile: panel resize (issue 11) dan edit di preview (issue 10) boleh hanya untuk `lg` ke atas;
  di mobile tetap form + preview bertumpuk, tapi preview tidak boleh rusak.

---

## 5. Urutan eksekusi & ketergantungan

```
00 Fondasi data  ──┬─> 02 Skill & section hilang
                   ├─> 07 Kelola section (DnD, hapus, divider)
                   ├─> 08 Pilih template
                   └─> 09 Gaya per blok
01 Bug cepat (rk, Simpan)        (bebas)
03 Target pekerjaan dulu         (bebas)
04 Paritas preview = PDF  ──┬─> 09 Gaya per blok
                            └─> 10 Edit langsung di preview
05 Input bullet ──> 06 AI auto-bullet
11 Panel bisa ditarik            (bebas)
12 Panduan & "Lainnya"           (setelah 05–10, karena menjelaskan fitur-fiturnya)
13 Review akhir                  (terakhir)
```

Tahap yang disarankan (tiap tahap = 1 PR):
- **Tahap 1 (perbaikan cepat):** 00, 01, 02, 03
- **Tahap 2 (paritas PDF):** 04
- **Tahap 3 (input & AI):** 05, 06
- **Tahap 4 (tata letak):** 07, 08, 11
- **Tahap 5 (editor di preview):** 09, 10
- **Tahap 6 (panduan & review):** 12, 13

---

## 6. Di luar scope
- Fitur bandingkan versi CV.
- Template dengan layout dua kolom/foto (tidak ATS-friendly; semua template tetap satu kolom).
- Rich text bebas (bold/italic per kata). Edit di preview tetap teks polos per field.
- Kolaborasi multi-user real time.

---

## Comments
