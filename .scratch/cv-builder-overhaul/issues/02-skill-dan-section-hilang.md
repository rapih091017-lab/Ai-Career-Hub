# 02 — Skill/level/sertifikasi/Evaluasi Diri tidak tampil di CV

Status: siap-agent
Blocked by: 00

## Masalah
- Level skill dipilih tapi tidak pernah dirender (PRD temuan B).
- User melapor skill sudah diisi tapi tidak tampil di preview & PDF (PRD temuan C).
- `selfEvaluation` tidak ada di `DEFAULT_SECTION_ORDER` → tidak pernah tampil.
- Sertifikasi ikut hilang kalau skill kosong.

## Rencana
1. **Reproduksi dulu.** Buat CV, isi skill, cek preview. Coba juga dengan localStorage
   `cv_fmt_<id>` berisi `sectionOrder` tanpa `skills` dan `sectionVisibility.skills=false`.
   Catat penyebab yang benar di bagian Comments sebelum memperbaiki.
2. Jadikan **Sertifikasi** section sendiri (`certifications`) di `SectionKey`, `DEFAULT_SECTION_ORDER`,
   `CV_LABELS` (SERTIFIKASI / CERTIFICATIONS), renderer, dan `SECTION_LABEL_MAP`. CV lama: kalau
   `sectionOrder` tersimpan tidak memuat `certifications`, sisipkan tepat setelah `skills` agar posisi
   visual sama seperti sebelumnya.
3. Tambah `selfEvaluation` ke urutan default (setelah `summary`) — tampil hanya jika berisi.
4. Render level skill sesuai keputusan K3 (`layout.showSkillLevel`): `Nama (Mahir)`; label ikut `cvLang`.
   Toggle di `DisplaySettingsModal`. Ganti juga label opsi di `SkillSection` ke Bahasa Indonesia
   (Pemula/Menengah/Mahir) + keterangan singkat arti tiap level.
5. Skill dengan nama kosong tidak dirender; kategori tanpa skill bernama tidak dirender.
6. Di form, kalau sebuah section berisi data tapi disembunyikan/tidak ada di urutan, tampilkan
   pemberitahuan di kartu section: "Bagian ini disembunyikan dari CV. [Tampilkan]".
7. Perubahan renderer berlaku sama di jalur PDF (sebelum issue 04 selesai: ubah juga `CvPdfDocument`).

## Kriteria selesai
- Skill terisi → tampil di preview & PDF. Sertifikasi tampil walau skill kosong.
- Evaluasi Diri terisi → tampil.
- Toggle level → `React (Mahir)` muncul di preview & PDF.
- Test renderer (`renderToStaticMarkup`) untuk keempat kasus di atas + CV lama tanpa `layout`.

## Comments
