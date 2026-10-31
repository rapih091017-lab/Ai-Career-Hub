# 05 — Kolom input mendukung bullet

Status: siap-agent
Blocked by: -

## Masalah
Deskripsi kerja/organisasi dan "Lainnya" adalah textarea polos; aturan "satu baris = satu poin"
tidak terlihat.

## Rencana
1. Komponen `BulletTextarea` (`src/components/builder/BulletTextarea.tsx`), tetap `<textarea>` agar
   ringan dan aksesibel:
   - Mode **Poin** (default untuk deskripsi kerja/organisasi/Lainnya) dan **Paragraf** (toggle kecil).
   - Mode Poin: setiap baris tampil diawali "• " secara visual (gutter di kiri lewat overlay atau
     `background` per baris), nilai yang disimpan tetap teks per baris **tanpa** "• ".
     Alternatif lebih sederhana: daftar input satu baris per poin dengan tombol tambah/hapus dan
     drag handle (dnd-kit). Pilih yang lebih stabil setelah prototipe singkat; catat di Comments.
   - Enter = poin baru; Backspace di poin kosong = gabung ke poin sebelumnya; tempel teks berisi
     "•", "-", "*", "1." di awal baris → dibersihkan otomatis (`normalizeBulletLines` di `src/lib/`).
2. Simpan `contentType` ("bullets"/"paragraph") untuk custom section; untuk deskripsi kerja
   tambahkan field opsional `descriptionType` (default "bullets" = perilaku lama).
3. Renderer: mode paragraf dirender sebagai `<p>`, mode poin sebagai `<ul>` (sudah begitu sekarang).
4. Ringkasan & Evaluasi Diri tetap paragraf.

## Kriteria selesai
- Ketik 3 baris → preview 3 bullet. Tempel "• a\n- b" → tersimpan "a\nb".
- Data lama (teks dengan baris) tampil sama.
- Test unit `normalizeBulletLines`.

## Comments
- Desain dipilih: daftar input per poin (`src/components/builder/BulletEditor.tsx`), bukan overlay textarea —
  lebih stabil untuk fokus/kursor, drag (dnd-kit) dan tombol naik/turun. Nama komponen BulletEditor
  (bukan BulletTextarea). Logika murni di `src/lib/bullet-editor-ops.ts` + `src/lib/bullet-lines.ts`.
  Diuji di Chromium 390px (Enter, Backspace gabung/hapus, tempel, Alt+panah, drag keyboard & mouse).
