# 12 — Panduan tiap fitur, penjelasan ikon AI, dan "Lainnya"

Status: siap-agent
Blocked by: 05, 06, 07, 08, 09, 10

## Rencana
1. **Ikon bintang (`auto_awesome`) di pojok input** (`AIPolishButton`):
   - Ganti jadi tombol berlabel kecil "Poles AI" (ikon + teks) atau ikon dengan popover yang bisa
     di-tap (bukan hanya `title`).
   - Isi popover: "Poles AI merapikan kalimat di kolom ini agar lebih jelas dan sesuai target
     pekerjaan. Fakta dan angka tidak ditambah."
   - Setelah diklik: tampilkan sebelum/sesudah dan tombol "Pakai" / "Batal" (sekarang langsung
     menimpa). Minimal: toast dengan "Urungkan".
2. **Ikon (i) bantuan per field** (komponen `FieldHelp`): popover berisi apa itu, contoh yang baik,
   dan contoh yang kurang. Konten di satu file data `src/lib/builder-help.ts` agar mudah dirawat.
   Wajib untuk: Jabatan profesional/motto, Status pekerjaan, Field kustom, Ringkasan, Target posisi,
   Deskripsi pekerjaan (lowongan), Deskripsi perusahaan, Pencapaian utama, Deskripsi kerja, IPK,
   Kategori & level skill, Sertifikasi, Evaluasi Diri, Bagian tambahan.
3. **Panduan fitur toolbar & preview**: tiap kontrol toolbar (font, ukuran, rata, garis, urutan,
   tampilan, template, PDF, Optimasi AI) punya tooltip yang bisa di-tap dengan satu kalimat fungsi.
   Tur singkat pertama kali (4–5 langkah: Target → isi form → edit di preview → atur tampilan →
   unduh PDF), bisa dilewati, status "sudah lihat" di localStorage, bisa dibuka lagi dari tombol
   "Panduan" di header builder.
4. **"Lainnya" diperjelas**:
   - Ganti nama jadi **"Bagian Tambahan"** dengan judul yang bisa diubah (default "Lainnya" untuk
     data lama agar CV lama tetap sama).
   - Pilihan cepat judul: Penghargaan, Proyek, Publikasi, Bahasa, Kegiatan Sukarela, Pelatihan.
   - Deskripsi: "Untuk hal penting yang tidak masuk bagian lain."
   - Contoh per judul (placeholder), mis. Bahasa: "Inggris — aktif (TOEFL ITP [skor])";
     Penghargaan: "Juara 1 Lomba Inovasi Tingkat Provinsi, [tahun]". Ikuti aturan: tanpa angka karangan,
     pakai placeholder.
   - Bisa lebih dari satu bagian tambahan (lihat issue 07 "+ Tambah bagian").
5. Semua copy dicek dengan `antislop.md` + `skills/antislop-copywriting/SKILL.md` (waktu sesuai K2).

## Kriteria selesai
- Setiap field yang disebut di poin 2 punya bantuan yang bisa dibuka di desktop dan HP.
- Ikon AI tidak lagi tanpa label/penjelasan; hasil Poles AI bisa dibatalkan.
- User baru melihat tur sekali; bisa dibuka lagi.

## Comments
