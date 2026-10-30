# 03 — Arahkan user mengisi Target Pekerjaan lebih dulu

Status: siap-agent
Blocked by: -

## Masalah
Semua fitur AI memakai `jobTitle`/`jobDescription`, tapi Target ada di langkah ke-2 dan tidak ada arahan.

## Rencana
1. Pindahkan langkah **Target Pekerjaan** jadi langkah pertama di `STEP_KEYS`
   (`src/app/builder/[id]/page.tsx`). Perbarui semua indeks yang di-hardcode: `activeStep === N`,
   `sectionStepMap` di `onSectionClick`, `useBuilderAI` (`setActiveStep`), shortcut `Math.min(6, …)`,
   `StepperNav`, `ReviewStep`. Ganti angka ajaib dengan konstanta `STEP.TARGET`, `STEP.PERSONAL`, dst.
2. Saat builder dibuka dan `jobTitle` kosong → buka langkah Target.
3. Tombol AI (Saran AI, Optimalkan, ikon poles) saat `jobTitle` kosong: tetap bisa dipakai, tapi
   tampilkan catatan kecil "Hasil AI lebih tepat kalau Target Pekerjaan diisi. [Isi sekarang]" yang
   pindah ke langkah Target.
4. Jelaskan di halaman Target bahwa judul posisi **tidak** dicetak di CV (hanya untuk AI), dan bedanya
   dengan "Jabatan profesional/motto" di Data Diri yang dicetak di bawah nama.

## Kriteria selesai
- CV baru tanpa target → langkah pertama yang terbuka adalah Target.
- Klik section di preview tetap membuka langkah yang benar.

## Comments
