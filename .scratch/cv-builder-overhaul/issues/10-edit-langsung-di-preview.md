# 10 — Preview bisa diedit langsung (real time)

Status: siap-agent
Blocked by: 04, 07

## Rencana
1. Renderer menerima `mode: "edit" | "print"`. Mode print (ekspor PDF, thumbnail) = HTML statis
   tanpa atribut edit, supaya PDF tetap identik.
2. Komponen `EditableText` dipakai untuk setiap teks yang berasal dari satu field: nama, jabatan
   profesional, kontak, ringkasan, posisi, perusahaan, lokasi, tanggal (buka input `month` kecil),
   institusi, dsb. Tiap poin bullet = satu `EditableText` dengan path `workHistory[id].description[n]`.
   - `contentEditable="plaintext-only"` dengan fallback `true` + penanganan paste teks polos.
   - Commit ke `cvData` saat input (debounce ringan) lewat `onEdit(path, value)`; form kiri ikut berubah.
   - Enter di poin bullet = poin baru; Backspace di poin kosong = hapus poin.
   - Placeholder abu-abu untuk field kosong hanya di mode edit (tidak ikut PDF).
   - Hati-hati IME (keyboard HP/Bahasa Asia): jangan commit saat `isComposing`.
3. Aksi blok saat hover/fokus section: handle drag (issue 07), "Atur gaya" (issue 09),
   "Sembunyikan", "Hapus" (opsional saja), "Edit di form" (lompat ke langkah form).
4. Undo/redo sederhana (Ctrl+Z / Ctrl+Shift+Z) untuk perubahan dari preview: riwayat snapshot
   `cvData` maksimal 50, dibuang saat pindah halaman.
5. Paginasi (issue 04) dihitung ulang saat mengetik tanpa membuat caret melompat: jangan me-remount
   node yang sedang fokus; pindahkan blok antar halaman hanya saat blur atau saat jumlah halaman berubah.
6. Mobile: edit di preview dimatikan (tap section = buka langkah form), hindari bentrok scroll.

## Kriteria selesai
- Ketik di nama pada preview → form kiri ikut berubah, autosave jalan, PDF sama.
- Edit poin bullet, tambah poin dengan Enter, hapus dengan Backspace.
- Caret tidak melompat saat paginasi berubah. Test Playwright untuk alur ini.

## Comments
