# 06 — Hasil Saran AI / Optimalkan / Poles otomatis jadi bullet

Status: siap-agent
Blocked by: 05

## Rencana
1. Pakai `normalizeBulletLines` (issue 05) di semua jalur yang menulis ke field poin:
   - `onAccept` Saran AI & Optimalkan di `WorkCard.tsx`, `OrgCard.tsx` (cek apakah ada AI di sana).
   - `AIPolishButton` bila `field` adalah deskripsi/achievement list.
   - `AutoFixPanel.tsx` (perbaikan otomatis dari review).
2. Prompt: di `src/lib/ai/prompts/revision-v2.ts`, `suggestion-v2.ts`, dan prompt di
   `src/app/api/ai/polish/route.ts`, nyatakan eksplisit: untuk field deskripsi, kembalikan satu poin
   per baris tanpa simbol bullet; untuk ringkasan, satu paragraf. Tetap patuhi aturan AI di `AGENTS.md`
   (tidak mengarang angka → placeholder `[angka]`, bahasa sama dengan CV).
3. Saran AI (mode suggest) yang mengembalikan beberapa bullet: tombol "Pakai" menambah poin terpilih
   ke daftar (bukan mengganti seluruh deskripsi), plus tombol "Ganti semua".
4. Modal `AIProposalModal`: tampilkan versi sebagai daftar bullet, bukan paragraf.

## Kriteria selesai
- Respons AI berisi "1. foo\n2. bar" atau "• foo • bar" → tersimpan "foo\nbar".
- Test unit untuk tiap jalur accept (fungsi murni yang menggabungkan poin).

## Comments
