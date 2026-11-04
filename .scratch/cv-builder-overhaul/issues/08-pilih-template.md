# 08 — Pilih template dari toolbar editorial

Status: siap-agent
Blocked by: 00

## Rencana
1. Tombol "Template" di `FormatToolbar` → popover/galeri kecil berisi 5 gaya `TEMPLATE_STYLES`
   dengan thumbnail (pakai `CvTemplatePreview`/`CssThumbnail` yang sudah ada bila cocok).
2. Pilih → `setSelectedTemplateId` + simpan `templateId` lewat `PUT /api/cv-documents/[id]`
   (route sudah menerima `templateId`).
3. Ganti template **tidak** menimpa override user (font/ukuran/warna/gaya per blok). Sediakan tombol
   "Kembalikan ke gaya template" yang menghapus override global (dengan konfirmasi).
4. Jelaskan singkat beda tiap template (satu kalimat, mis. "Serif, cocok untuk posisi manajerial").

## Kriteria selesai
- Ganti template di builder → preview & PDF berubah; reload tetap.

## Comments
