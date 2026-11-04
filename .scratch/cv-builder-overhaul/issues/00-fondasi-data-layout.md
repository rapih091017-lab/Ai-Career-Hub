# 00 — Simpan pengaturan tampilan & "Lainnya" di server

Status: siap-agent
Blocked by: -

## Masalah
`src/hooks/useBuilderFormat.ts` menyimpan font, ukuran, rata teks, divider, warna, spasi, header,
margin, `sectionOrder`, `sectionVisibility`, dan `customSections` (termasuk isi "Lainnya") hanya di
`localStorage` (`cv_fmt_<cvId>`). Ganti perangkat = hilang, dan data localStorage lama bisa membuat
section tidak tampil tanpa penjelasan.

## Rencana
1. Tambah tipe `CvLayout` di `src/components/cv-templates/index.tsx`:
   ```ts
   interface CvLayout {
     fontFamily?: string; fontSize?: number; textAlign?: "left"|"center"|"right"|"justify";
     showDividers?: boolean; primaryColor?: string;
     spacingMode?: "compact"|"normal"|"spacious"; headerLayout?: "centered"|"left";
     marginMode?: "tight"|"normal"|"wide";
     sectionOrder?: string[]; sectionVisibility?: Record<string, boolean>;
     showSkillLevel?: boolean;              // issue 02
     dividers?: Record<string, boolean>;    // issue 07, per section
     sectionStyles?: Record<string, BlockStyle>; // issue 09
   }
   ```
   dan field opsional `layout?: CvLayout` + pindahkan `customSections` agar ikut `CvData` yang disimpan.
2. `useBuilderFormat` membaca dari `cvData.layout` (sumber utama). Saat load: kalau `cvData.layout`
   kosong tapi localStorage ada → migrasi sekali ke `cvData.layout`, lalu hapus key localStorage.
3. Setter di hook menulis ke `cvData.layout` lewat `setCvData` sehingga `useAutoSave` ikut menyimpan.
4. Validasi saat load (`sanitizeLayout`): buang nilai invalid (bukan diganti default); pastikan
   `sectionOrder` memuat semua section bawaan yang punya isi — section bawaan yang hilang dari
   urutan ditambahkan di posisi default.
5. Perbaiki `handleSave` di `src/app/builder/[id]/page.tsx:180` → kirim `{ tailoredContent: cvData, templateId }`
   (lihat issue 01 — boleh digabung di sini).

## Kriteria selesai
- Ubah font/urutan/isi Lainnya, reload di browser lain (atau hapus localStorage) → tetap sama.
- CV lama tanpa `layout` tampil persis seperti sebelumnya.
- Test unit `sanitizeLayout` (nilai invalid dibuang, section bawaan yang hilang dikembalikan).

## Comments
