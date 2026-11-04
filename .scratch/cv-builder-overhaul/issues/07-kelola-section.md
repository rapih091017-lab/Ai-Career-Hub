# 07 — Kelola section: drag and drop, hapus section opsional, divider

Status: siap-agent
Blocked by: 00, 02

## Rencana
1. **Drag and drop urutan** dengan `@dnd-kit/sortable` (contoh pola di `src/components/tracker/JobCard.tsx`):
   - Di `SectionOrderModal` (ganti tombol panah jadi handle drag; tombol panah tetap ada, kecil, untuk
     keyboard/pembaca layar) — `KeyboardSensor` + `sortableKeyboardCoordinates`.
   - Di preview (issue 10 memperluas): handle drag muncul saat hover section.
   - Entri dalam section (pengalaman, pendidikan, organisasi) juga bisa di-drag di form, menggantikan
     tombol naik/turun yang ada di `WorkCard`/`EducationCard`/`OrgCard`.
2. **Section opsional**: Organisasi, Evaluasi Diri, Sertifikasi, Lainnya/Bagian tambahan.
   - Tiap kartu section opsional di form punya menu "Hapus bagian ini" → konfirmasi → data dikosongkan
     dan section keluar dari `sectionOrder`. Toast dengan tombol "Urungkan" (simpan snapshot sementara).
   - Tombol "+ Tambah bagian" (di form & modal urutan) untuk memunculkan lagi section yang dihapus
     atau membuat section kustom baru (judul bebas, mis. "Penghargaan", "Bahasa", "Publikasi").
   - Section wajib (Data Diri/header, Pengalaman, Pendidikan, Keahlian) tidak bisa dihapus, hanya
     disembunyikan.
   - Langkah stepper untuk section yang dihapus tetap ada tapi menampilkan status "Tidak dipakai".
3. **Divider per section**: ganti toggle global `showDividers` dengan `layout.dividers[sectionKey]`
   (garis di atas section tsb). Toggle global tetap ada sebagai "Semua garis on/off".
   Di preview: hover di antara dua section → tombol kecil "+ garis" / "× hapus garis".
   Garis ikut pindah bersama section saat di-drag (karena melekat ke section).

## Kriteria selesai
- Urutan bisa diubah dengan mouse, sentuh, dan keyboard; tersimpan di server.
- Hapus Organisasi → hilang dari form aktif, preview, PDF; Urungkan mengembalikan data.
- Garis antar section bisa dihapus satu per satu.

## Comments
