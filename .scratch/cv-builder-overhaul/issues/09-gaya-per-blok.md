# 09 — Atur font/ukuran/rata teks per bagian (bukan global)

Status: siap-agent
Blocked by: 00, 04

## Rencana
1. Data: `layout.sectionStyles[key]: BlockStyle` dengan `BlockStyle = { fontFamily?, fontSize?,
   textAlign?, lineHeight?, titleColor? }`. Kunci: `header`, kunci section bawaan, id section kustom.
   Nilai kosong = ikut global.
2. Renderer: gaya efektif blok = template → global → `sectionStyles[key]`.
3. UI: klik/pilih sebuah section di preview → section ditandai (outline) dan toolbar editorial
   berganti konteks: label "Mengatur: Pengalaman Kerja" + tombol "Terapkan ke semua" dan
   "Reset bagian ini". Tanpa section terpilih → toolbar mengatur global (perilaku sekarang).
   Di mobile: pilih bagian lewat dropdown "Atur bagian: [Semua ▾]" di toolbar.
4. Indikator kecil di preview (titik) pada section yang punya gaya khusus.

## Kriteria selesai
- Set Ringkasan rata kanan-kiri (justify) dan Pengalaman rata kiri → keduanya terlihat beda di
  preview & PDF. Reset bagian → kembali ke global.

## Comments
