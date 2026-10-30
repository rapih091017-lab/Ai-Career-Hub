# 13 — Review akhir menyeluruh

Status: siap-agent
Blocked by: 00–12

## Checklist
1. `npm run lint`, `npx tsc --noEmit`, `npm test` hijau; `npm run build` sukses.
2. Test paritas visual issue 04 dijalankan ulang untuk semua template × 3 margin × 2 font.
3. Skenario manual end-to-end di Chromium (Playwright) desktop 1440px dan mobile 390px:
   CV baru → Target → isi semua langkah → edit di preview → drag section → hapus Organisasi →
   urungkan → gaya per blok → ganti template → unduh PDF → buka PDF, bandingkan.
4. CV lama (fixture tanpa `layout`, dengan localStorage lama) tampil sama dan termigrasi.
5. Aksesibilitas: navigasi keyboard penuh (stepper, DnD, splitter, popover bantuan), fokus terlihat,
   label ARIA, kontras.
6. Antislop: UI (`skills/antislop-ui`), copy (`skills/antislop-copywriting`), mobile
   (`skills/antislop-layoutmobile`), komentar kode (`skills/antislop-code`).
7. `/code-review` level high atas seluruh diff + `/security-review` (HTML yang dikirim ke
   `export-pdf-v2`: pastikan tidak ada script/URL privat; route sudah punya `isPrivateUrl`).
8. Catat hasil, temuan yang tidak diperbaiki, dan keputusan di `## Comments` file ini.

## Comments
