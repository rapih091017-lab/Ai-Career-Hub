# 11 — Panel input bisa diperlebar/dipersempit

Status: siap-agent
Blocked by: -

## Rencana
1. Splitter vertikal di antara panel kiri & kanan (`lg` ke atas) di `src/app/builder/[id]/page.tsx`,
   tanpa dependency: `pointerdown` → `pointermove` (setPointerCapture) → ubah lebar kiri dalam %.
   Batas 30%–70%. Dobel klik = kembali 50%.
2. Aksesibel: `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow`, panah kiri/kanan
   menggeser 5%. Area pegang ≥ 8px, terlihat jelas saat hover.
3. Simpan lebar di localStorage (preferensi per pengguna, bukan data CV; aman bila gagal).
4. Preview menyesuaikan skala ke lebar panel (fit-to-width) memakai `transform: scale()` pada
   pembungkus, dihitung via ResizeObserver; ukuran A4 di dalam tetap asli (penting untuk issue 04).
   Tambah kontrol zoom kecil (Pas lebar / 100%).

## Kriteria selesai
- Tarik pemisah → panel berubah mulus, preview tetap utuh dan tajam, tidak ada scroll horizontal.
- Bisa dioperasikan dengan keyboard.

## Comments
