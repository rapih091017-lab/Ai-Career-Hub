# 04 — PDF 100% sama dengan preview

Status: butuh-info (menunggu keputusan K1 di PRD)
Blocked by: -

## Masalah
Dua renderer (HTML vs react-pdf), satuan px vs pt, font berbeda, pemenggalan halaman berbeda.
Detail di PRD temuan A.

## Rencana (Opsi A — rekomendasi)
1. **Satuan.** Ubah `AtsBaseRenderer` agar semua ukuran memakai `pt` (font, margin, padding,
   border) — string `"11pt"`, bukan angka. Ini mengubah tampilan preview agar sama dengan ukuran
   cetak yang benar. Margin halaman pakai `mm`.
2. **Font.** Hanya tawarkan font yang bisa dimuat sama persis di browser dan di Chromium server:
   muat lewat `@font-face`/Google Fonts yang sama di preview dan di HTML PDF.
   Pemetaan aman metrik: Arial→Arimo, Times New Roman→Tinos, Calibri→Carlito, plus Inter, Roboto,
   Plus Jakarta Sans, Open Sans. Nama di dropdown tetap ramah ("Arial (Arimo)").
   Perbarui `TEMPLATE_STYLES` dan opsi di `FormatToolbar`.
3. **Paginasi di preview.** Ganti "satu kertas panjang + garis putus" dengan halaman A4 nyata:
   - Komponen `PaginatedCv` merender konten sekali di wadah ukur tersembunyi (lebar = 210mm − 2×margin),
     mengukur blok atomik (header, judul section + entri pertama, tiap entri, tiap poin bullet untuk entri
     panjang), lalu membagi ke halaman berukuran `297mm − 2×margin`.
   - Aturan: judul section tidak boleh sendirian di bawah halaman; entri boleh terbelah antar poin bullet.
   - Ukur ulang saat data/format berubah (debounce ±150ms) dan setelah `document.fonts.ready`.
   - Tiap halaman = `div` 210×297mm dengan padding = margin. Skala tampilan pakai `transform` di
     pembungkus luar saja (agar ukuran asli tidak berubah).
4. **Ekspor.** Serialisasi DOM halaman-halaman yang sama (mode cetak: tanpa handle edit/hover) →
   `POST /api/export-pdf-v2` dengan `@page { size: A4; margin: 0 }` dan `page-break-after: always`
   per halaman. Gunakan/menyesuaikan `serializePreviewHtml` di `src/lib/pdf-export.ts`.
   Pastikan CSS font ikut di HTML dan Chromium menunggu `document.fonts.ready`.
   Tangani error kuota (pesan jelas + tautan paket) sesuai keputusan K1.
5. Hapus `CvPdfDocument`/`generate-cv-pdf` dari builder bila tidak dipakai di tempat lain
   (cek `src/__tests__/cv-pdf*.ts`, perbarui test).
6. Badge "N halaman" memakai hasil paginasi, bukan tinggi/konstanta.

## Kriteria selesai
- Test visual otomatis (Playwright, Chromium sudah terpasang): render preview fixture
  (`src/__tests__/cv-pdf.fixture.ts`) → screenshot tiap halaman; render PDF → rasterisasi pakai
  `pdfjs-dist` di skala sama → selisih piksel < 0,5% per halaman. Uji 3 fixture: 1 halaman,
  2 halaman dengan entri terbelah, font serif + margin Mepet.
- Jarak nama → kontak → section pertama identik di preview dan PDF.
- Teks PDF bisa diseleksi & disalin (cek `pdf-parse`).

## Comments
