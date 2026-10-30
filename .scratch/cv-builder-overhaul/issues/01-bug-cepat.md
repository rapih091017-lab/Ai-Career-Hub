# 01 — Bug cepat: teks "rk" di Optimalkan & tombol Simpan

Status: siap-agent
Blocked by: -

## Masalah
1. Ikon `"spark"` tidak ada di font Material Symbols → tampil teks terpotong "rk".
   Lokasi: `src/components/builder/WorkCard.tsx:327`, `src/components/builder/SummarySection.tsx:269`.
2. `handleSave` mengirim body yang salah (lihat PRD temuan E) → Simpan manual tidak menyimpan.

## Rencana
1. Hapus `<span class="material-symbols-outlined">spark</span>` pada kedua tombol "Optimalkan"
   (permintaan user: hapus). Saat loading tetap pakai ikon `sync` yang valid.
   Cari juga nama ikon lain yang tidak valid: `grep -rn 'material-symbols' src | ...` dan cek
   terhadap daftar ikon yang dipakai; minimal pastikan tidak ada lagi `"spark"`.
2. `handleSave` kirim `{ tailoredContent: cvData }` (+ `templateId` bila issue 08 sudah ada).
   Tambah test yang memastikan body PUT dari builder memakai key `tailoredContent`.

## Kriteria selesai
- Tombol Optimalkan hanya bertuliskan "Optimalkan" tanpa sisa teks ikon.
- Klik Simpan → reload → data sama (cek network: body berisi `tailoredContent`).

## Comments
