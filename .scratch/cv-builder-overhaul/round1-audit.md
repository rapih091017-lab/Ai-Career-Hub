# Ronde 1 — Temuan audit (roaster R, frontend F, backend B)

## Uang / keamanan
- R1 [PARAH] `cv_build` tidak ada di paket mana pun (`src/lib/access.ts:44-80`, ada `ai_cv_generate`) → `checkQuota` di `api-utils.ts:171-207` dapat limit `undefined` → selalu lolos. `cv-documents/create/route.ts:25,64`. Key tak terdaftar = unlimited (fail-open).
- R2/B3 [PARAH] `/api/ai/polish` & `/api/ai/grammar` tanpa auth/kuota, hanya rate limit per IP in-memory (`rate-limiter.ts:14` Map, per instance). Body tak divalidasi (`skills.join` pada non-array → 500, polish:103-104).
- R4 [PARAH] GET `cv-documents/[id]/route.ts:60-63` pakai `staleWhileRevalidate(30)` = `Cache-Control: public` untuk data pribadi ber-auth → risiko bocor via CDN + data basi lalu ditimpa autosave.
- R7/B4 [SEDANG] Race kuota: cek lalu log setelah kerja (export-pdf-v2:41,111; create:218 `.catch(()=>{})`; auto-fix:73-90,147; revise 4 tempat duplikasi logika kuota). Awal bulan pakai jam server (UTC).
- R8 [SEDANG] Webhook Kasera (`api/payments/kasera/webhook/route.ts:56-77`) tidak cocokkan amount; `or(...)` bisa cocok ke transactionId order lain.
- B1/R9 [TINGGI] PUT cv-documents tanpa zod, tanpa batas ukuran, templateId tak divalidasi, JSON rusak → 500. Update/delete pakai `eq(id)` saja (38, 91/95).
- B5 [SEDANG] auto-fix menerima `body.cv` mentah ke prompt (auto-fix:94).

## Aturan AI (AGENTS.md)
- R3 [PARAH] prompt polish mengizinkan angka karangan bertanda `[est.]` + few-shot fabrikasi.
- B6/B7 [SEDANG] revision-v2.ts:165-178, suggestion-v2.ts:17,149-152: contoh angka karangan, klaim "lolos ATS", "recruiters". Acuan patuh: `auto-fix-v1.ts:30-33`.

## Data hilang (builder)
- F1 [PARAH] `useBuilderFormat.ts:49/86`: effect simpan jalan sebelum effect muat → menimpa localStorage dengan default → setelan format SELALU reset tiap reload.
- R5/F3 [SEDANG] autosave: prevCvData diset sebelum request; gagal tak di-retry; status error hilang 2 dtk; tidak flush saat unmount/beforeunload; PUT tak perlu setelah load (prev=emptyCvData).
- R6 [SEDANG] `useFetchCvData.ts:63-133` format nested membuang field tak dikenal + level kosong dipaksa "intermediate", lalu autosave menulis balik.
- R10 [RINGAN] PUT last-write-wins, tanpa cek updatedAt (dua tab).
- F4 handleSave body salah (sudah di plan).
- F5 [SEDANG] ID pakai Date.now() (useFetchCvData fallback berubah tiap load, useBuilderHelpers:39,112,184,257,291, SummarySection:137) → pakai crypto.randomUUID, ID permanen.
- F8 fetch tanpa AbortController.

## Struktur builder
- F2 [PARAH] ResizeObserver effect tanpa deps (page.tsx:76-108) dibuat ulang tiap render.
- F6 step index hardcode → StepId.
- F7 page.tsx 705 baris → ekstrak BuilderStepContent & PreviewPane dulu; issue yg sentuh page.tsx dikerjakan berurutan.
- F9 a11y (tabpanel, aria-live autosave), F10 mobile padding preview 15mm.
- F11 test terdampak: cv-pdf*.test.ts, i18n-integrity (kunci builder.* harus 2 bahasa).

## Usulan perubahan plan
- Issue 04 (F): fase 1 = satu alur DOM satuan pt/mm + font sama, Chromium memenggal pakai break-inside/break-after; preview hanya tampilkan garis batas halaman. Paginasi manual per blok hanya bila fase 1 meleset. Route PDF cukup render dari DB.
- Issue 04 (B): helper `src/lib/pdf/chromium.ts`; route `/api/cv-documents/[id]/pdf` auth+ownership, baca DB, tanpa kuota, rate limit per user + batas per jam berbasis DB, blokir semua network kecuali data:, font woff2 OFL di repo disematkan base64 (preview pakai file sama dari /public/fonts), `outputFileTracingIncludes`; renderer print harus murni (tanpa "use client"/effect); klien flush autosave + kirim expectedUpdatedAt → 409.
- Issue 10 (F): v1 = contentEditable hanya field satu baris + klik teks lompat ke field form; Enter/Backspace antar bullet & undo ditunda.

# Ronde 1 — Jawaban penjawab (ringkas)
- R1 VALID: `case "cv_build": limitKey="ai_cv_generate"` (log tetap cv_build) + fail-closed limit undefined → 403 FEATURE_NOT_AVAILABLE. checkQuota hanya dipakai create/export-pdf-v2/cover-letter, semua terpetakan. Free jadi 1x/bln (disengaja).
- R2 SEBAGIAN: pemanggil = builder (login) + `components/portfolio/builder/BuilderEditor.tsx` → cek apakah portfolio builder butuh login sebelum wajibkan auth. Solusi: auth + kuota ai_revision + zod body.
- R4 VALID: ganti ke `noCache()`/private no-store; grep GET ber-auth lain yg pakai staleWhileRevalidate.
- R7 VALID: db = postgres-js (transaksi didukung). Minimal: hapus `.catch(()=>{})` di create:218, awal bulan konsisten (UTC/WIB) dengan /api/usage; reserveQuota + advisory lock menyusul.
- R8 VALID: payments.amount ada (schema:210). Prioritas externalId, tolak referensi silang, amount beda → jangan success, balas 200 {mismatch:true}.
- B1/R9, B5, R3/B6/B7, F1, R5/F3, R6 (level kosong jangan dipaksa), F5, F8, F2: VALID, solusi sesuai audit.
- Issue 04: setuju fase 1. Catatan: paket `cek_cv`/`surat_lamaran` punya `pdf_export:false` → route PDF bebas kuota jangan jadi pintu belakang.
- Issue 10: setuju v1 dikecilkan.
- Urutan: A hotfix uang/keamanan → B hardening API → C data hilang builder → D struktur → E issue 04 lalu 10.

# Ronde 1 — Keputusan manager
- R2: portfolio build dibungkus AuthGuard → polish & grammar wajib login, TANPA kuota, rate limit per userId, zod body (400).
- PDF builder (issue 04, sesi berikut): tidak dihitung kuota, tapi paket pdf_export:false tetap 403 — PERLU KONFIRMASI USER.
- Sesi ini: Batch A (A1 R1+UTC+hapus .catch create:218, A2 R4 noCache semua GET ber-auth, A3 R8 Kasera, A4 R2, A5 prompt AI) + Batch C (C1 F1 loadedRef, C2 autosave retry/flush/prev setelah sukses, C3 R6 additive normalisasi, C4 newId() crypto.randomUUID di src/lib/id.ts, C5 AbortController, C6 handleSave, C7 ResizeObserver deps) + issue 01 + issue 02 (certifications & selfEvaluation di urutan default + migrasi sisip, layout.showSkillLevel default false, toggle di DisplaySettingsModal, label Pemula/Menengah/Mahir, terapkan ke preview & CvPdfDocument).
- Ditunda: R7 lanjutan (reserveQuota), B1/R9, B5, F6/F7/F9/F10, issue 00, 03–13.

# Keputusan user 2026-10-31
- PDF builder: BEBAS untuk semua paket (termasuk pdf_export:false), tanpa hitungan kuota. Tetap auth + ownership + rate limit anti-abuse.
- Kasera: nominal kosong/tak terbaca → tolak (tetap). Nominal teks "50000"/"50000.00" dibaca benar (commit fix pembayaran).
- Sertifikasi: punya toggle tampil/sembunyi sendiri (sudah ada di Pengaturan Tampilan).
