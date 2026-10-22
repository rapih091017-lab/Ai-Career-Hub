<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Local markdown — issues live as files in `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Bahasa Indonesia labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->

## Checker upgrade — aturan global
- Hasil disimpan di `checker_results` (jsonb `scores`, `aiFeedback`, `fullResult`); pemetaan ke UI lewat `analysisFromFullResult`.
- Field baru: opsional, di dalam `fullResult`, tanpa migrasi DB. Baris lama harus tampil persis seperti sebelumnya. Yang tidak ada di baris tidak ditampilkan sebagai angka atau klaim. Nilai invalid dibuang, bukan diganti default. Untuk field AI baru pakai `.optional().catch(undefined)`.
- Setiap saran yang bisa ditempel ke CV punya `copy_text` (teks polos) + CopyButton.
- Aturan output AI: jangan mengarang fakta, angka, perusahaan, tools, atau sertifikasi (fakta kurang → placeholder `[angka]`, `[persen]`, `[jumlah orang]`); jangan menyebut statistik tentang HR/perekrut; `copy_text` dalam bahasa yang sama dengan CV (jangan campur Indonesia–Inggris); kutipan bukti harus potongan persis dari teks CV; jangan menjanjikan lolos ATS atau diterima.
- Dampak perbaikan = level Tinggi/Sedang/Rendah + estimasi menit. Angka poin hanya di `impactForecast`, berlabel estimasi.
- Tanpa dependency baru. Teks UI bahasa Indonesia. Komentar kode bahasa Indonesia.
- Di luar scope: fitur bandingkan versi.

