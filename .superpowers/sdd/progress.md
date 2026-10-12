# SDD Progress — Portfolio Trust & Persistence

Plan: `docs/superpowers/plans/2026-10-10-portfolio-trust.md`
Spec: `docs/superpowers/specs/2026-10-10-portfolio-trust-design.md`
Worktree: `D:\ai-career-hub-portfolio-trust`
Branch: `feature/portfolio-trust`
Base commit: `b8dd9ff`

## Keputusan pre-flight

- `maxActivePortfolios: 0` berarti tidak bisa publish (user dikunci, tidak ada grandfathering)
- Test sumber-teks pada Task 4, 13, 14, 15 dibiarkan; reviewer diminta memeriksa apakah masih bermakna
- Task 9 memakai `auth()` dari `@/lib/auth` (NextAuth v5), bukan `getServerSession`

## Minor findings yang ditunda ke review akhir

- Task 1: assertion `PublishDialogProps` di `portfolio-schema.test.ts:518` tidak bisa gagal (tipenya `Record<string, boolean>`); komentarnya mengklaim sebaliknya
- Task 1: `TextAlignment` punya tiga definisi (`types.ts`, `schema.ts`, `live/page.tsx`) sedangkan `FontSize` sudah di-hoist
- Task 1: `colorValue` tidak trim dan tidak punya batas panjang; `rgba(1,2,3,.5)` ditolak padahal CSS menerimanya
- Task 1: `TypographySettings.alignment` masih `Record` penuh sementara schema dan `LiveData` sudah `Partial` (tipe mati)
- Task 1: `heroBgUrl` melewati `safeUrl`; aman sekarang karena tidak ada yang merendernya, tapi harus dihapus bukan di-wire
- Task 1: `PortfolioCanvas` drag-reorder (`handleDragEnd`) tidak ada testnya
- Task 1: `emptySectionIds` belum diadu dengan apa yang benar-benar dirender tiap section
- Task 2: margin cap data-URI di `SafeLink.tsx:100` salah hitung (349.502 bukan 349.524)
- Task 2: `safeUrlUnescaped(value)` dipanggil dua kali di jalur terima (`SafeLink.tsx:205,241`)
- Task 2: fixture base64 di test bukan kelipatan 4, hanya lolos karena `decodeHead` memotong 36
- Task 2: copy "ditolak: skema tidak diizinkan" juga tampil untuk `src=""` dan data URI yang salah label, di mana skema bukan masalahnya
- Task 2: panjang RIFF WebP (byte 4-8) tidak divalidasi
- Task 2: `npm run build` belum pernah dijalankan setelah `"use client"` dilepas;keamanan produksi baru terbukti di Task 3+
- Task 3: `resetKey={data}` di SectionBoundary memakai seluruh objek data; `data.formData` cukup
- Task 3: `componentDidCatch` mengetik `info.componentStack` manual; import `ErrorInfo` lebih bersih
- Task 3: ownership background/footer pindah dari wrapper ke root dokumen (disengaja, terdokumentasi)
- Task 4: `PublishedPortfolio.tsx` kini tak dipakai produksi (hanya test); hapus di Task 15 atau pindahkan testnya ke PortfolioDocument
- Task 4: `alignment` (text-align) belum ter-persist di PublishDialog extras — dijadwalkan Task 10
- Task 4: handle drag `PortfolioCanvas.tsx:68` ~24px, di bawah 44x44 — antre untuk pass touch-target
- Task 4: footer canvas baca `--p-font-size-sm` yang sudah tidak berlaku (var di-set di dalam dokumen) — referensi mati, kosmetik
- Task 5: dua literal `@page { size: A4; margin: 12mm }` inline di 2 halaman print; ekstrak jadi konstanta bersama agar tak divergen
- Task 5: boxShadow hardcoded rgba di tombol print floating (screen-only, kosmetik)
- Task 5: butuh verifikasi visual print di browser nyata (pagination, warna) — statis saja belum cukup
- Task 6/7: apply script pakai path relatif `drizzle/…`, pecah bila dijalankan di luar root (mengikuti konvensi 0020)
- Task 6/7: `created_at`/`updated_at` nullable di SQL; API task wajib set `updated_at` eksplisit
- Task 6/7: komentar bytea bilang "node-postgres" padahal runtime postgres-js — fungsional benar, komentar menyesatkan
- Task 9: `GET /api/portfolio/assets/[id]` stringify JSON in-memory untuk rujukan public assets; pertimbangkan SQL `LIKE` jika data tumbuh.
- Task 11: key fallback AI schema & StrictMode-safe `{ past, present, future }` undo stack terpasang.
- Task 12: GET draft transient gagal → jalur POST membuat draft duplikat (baris yatim; export tetap benar)
- Task 12: sync overwrite — data preview bisa menimpa draft server lebih baru bila dua tab terbuka (laten, belum ada pembaca lain)
- Task 12: `mt-3` di error ekspor menambah jarak pada parent `gap-4` toolbar (kosmetik)
- Task 13: test mati `portfolio-ai-map.test.ts:277` (`not.toMatch Object.entries(aiSuggestions)` — identifier sudah hilang, tak bisa gagal)
- Task 13: preview/page.tsx masih punya interface `PortfolioData` lokal tanpa `seo` (runtime aman, type tak bisa mendeteksi drop masa depan)
- Task 13: inline seo type diduplikasi di live/page.tsx:64 + test mengunci teks persisnya (refactor bersih akan gagal lock)
- Task 13: scan prefiks di `portfolio-seo.test.ts:53` hanya cocok entri `BASE_URL + "..."`; entri template-literal tak terjangkau
- Task 13: prompt AI `portfolio-v1.ts:115-117` tak pernah menghasilkan `seo.meta_description` (fallback deskripsi menutupinya)
- Task 13: concern laporan wave-3 soal "from snapshot" keliru ke arah aman — nilai sekarang live-derived
- Task 14: kedua legacy key dimakan saat key1 parseable-tapi-invalid (terjaga tak terjangkau) — tanpa catatan user-visible bahwa ada field yang di-coerce
- Task 14: 400 INVALID_DATA membuat footer sementara bilang "Tersimpan" sambil pending — beforeunload menutupinya
- Task 14: race sub-detik di "Draft baru" (pending tidak invalidasi saat draftId berubah, jendela 100-500ms)
- Task 14: preview/page.tsx:210 masih `text-[11px]` (pre-existing, di luar diff)
- Task 14: `portfolio as unknown as ValidatedPortfolioData` double-cast di BuilderEditor:328 — server PATCH 400 satu-satunya batas
- Task 14: `portfolio.publish-*` i18n masih menyebut "Live Builder" (dilaporkan di luar lingkup)
- Task 14: 0 test render/jsdom untuk BuilderEditor (semua source-text + tsc)
- Task 15: PortfolioSpotlight cuma dapat nama tema tanpa deskripsi (tile sempit, opsional per brief)
- Task 15: re-indent whitespace tak sengaja pada grid testimonial di BuilderEditor (churn kecil di diff)
- Task 15: aria-label hardcoded di 3 section form dibiarkan agar konsisten dengan saudaranya
- Task 16: **soft-404 app-wide (pre-existing)** — semua detail page (`/p/`, `/career-hub/`, `/contoh-cv/`) mengembalikan 200 dengan konten tak-ditemukan; identik di master; dampak SEO; butuh tiket terpisah
- Task 16: `.env` worktree gagal validasi `src/lib/env.ts` (AUTH_SECRET/DEEPSEEK) — semua route DB melempar saat dev tanpa env injection (pre-existing)
- Task 16: sweep text-xs (37 pelanggaran) di 15 file portofolio; mockup visual setelah sweep belum diperiksa manusia

## Hasil review akhir cabang (final whole-branch)

Verdict awal **FIX FIRST** dengan 7 item — **semua sudah diperbaiki** (commit 6831137 + 82c4ba9):
1. Critical: PublishDialog menjatuhkan sectionOrder/sectionVisibility (tanpa extras) → fallback ke data draft + test payload
2. Fail-open quota → plan null + tombol retry "Coba lagi memeriksa"
3. SLUG_REGEX duplikat di PublishDialog → pakai isValidSlug dari portfolio-safety
4. Banner offline (draft.offline) di footer BuilderEditor + i18n `build.offline`
5. `rounded-xl` literal di render/PortfolioPhotoUpload → inline style
6. Definisi `portfolioTrialUses` mati dihapus dari schema
7. Housekeeping: `.superpowers/sdd/*-review-package.md` di-gitignore, 3 package untracked, artefak dev dibuang, laporan/brief di-commit

Triage lengkap review akhir (must-fix / follow-up / won't-fix) tercatat di laporan review dan sudah tereksekusi di atas untuk kategori must-fix.

**Catatan flake**: `cv-pdf-debug.test.ts` pernah timeout 5000ms saat suite paralel penuh (test CV, pre-existing, lolos 2x saat dijalankan sendiri) — bukan regresi Spec 1.

Gate akhir: tsc 0 · 390/390 test · build sukses · lint 0 error (28 warning pre-existing) · grep mutu bersih · smoke test server OK.

## Progress

Task 1: complete (commits b8dd9ff..cdbfecd, spec PASS, quality APPROVED, 115 test, 4 fix wave)
Task 2: complete (commits cdbfecd..8b6810e, spec PASS, quality APPROVED, 241 test, 3 fix wave)
Task 3: complete (commits 8b6810e..4037944, spec PASS, quality APPROVED, 272 test, 0 fix wave)
Task 4: complete (commits 4037944..b5e56b8, spec PASS, quality APPROVED, 276 test, 0 fix wave)
Task 5: complete (commits b5e56b8..b1fc2b2, spec PASS, quality APPROVED, 285 test, 1 fix wave)
Task 6+7: complete (commits b1fc2b2..d3bad69, spec PASS, quality APPROVED, 285 test, 0 fix wave)
Task 8: complete (commits d3bad69..72dcd7e, spec PASS, quality APPROVED, 290 test, 1 fix wave)
Task 9: complete (commits 72dcd7e..72ff562, spec PASS, quality APPROVED, 296 test, 1 fix wave)
Task 10: complete (commits 72ff562..f1b921f, spec PASS, quality APPROVED, 301 test, 0 fix wave)
Task 11: complete (commits f1b921f..f9d13ce, spec PASS, quality APPROVED, 312 test, 1 fix wave)
Task 12: complete (commits f9d13ce..08eb483, spec PASS, quality APPROVED, 330 test, 2 fix wave)
Task 13: complete (commits 08eb483..ba9b8da, spec PASS, quality APPROVED, 353 test, 3 fix wave + 2 controller)
Task 14: complete (commits ba9b8da..9d79a7a, spec PASS, quality APPROVED, 381 test, 2 fix wave + 2 controller)
Task 15: complete (commits 9d79a7a..a819bcb, spec PASS, quality APPROVED, 387 test, 0 fix wave)
Task 16: complete (commits a819bcb..HEAD, semua gate hijau, 387 test, 1 fix — sweep text-xs)
---

# SDD Progress - Spec 2: Fondasi Tema

Plan: docs/superpowers/plans/2026-10-12-portfolio-theme-foundation.md
Spec: docs/superpowers/specs/2026-10-12-portfolio-theme-foundation-design.md
Branch: feature/portfolio-themes
Base commit: 641c722

## Keputusan konsultan (mengikat)

- lucide-react & framer-motion DITOLAK; Motion via motion/react, ikon SVG inline
- Komponen MinimalistHero external DITOLAK sebagai unit; idenya jadi dasar Spec 2.5
- Tema Minimalist DIUNDUR ke Spec 2.5
- Token = field bertipe di ThemeDefinition (bukan CSS-var, bukan Tailwind)
- Enforcement = 2 layer Vitest (bukan ESLint)
- next/font DITOLAK (mati di export); fontUrl Google Fonts only

## Progress

Task 1 (Spec2): complete (commits d9656ad..b257fe0, spec PASS, quality APPROVED, 411 test, 1 fix wave)

## Minor findings Spec 2
- T1: shadow.focus glass alpha0.55 vs focusRing hex; focusRing/shadow.focus duplikat colors.primary (sinkron di T5)
- T1: fallback font bare sans-serif, spec minta stack eksplisit ui-sans-serif, system-ui (selesaikan di T4/T6)
- T1: list grup token di test hardcoded (tsc yang jaring sub-field)
- T1: T5 pakai outline via focusRing agar test Luxe box-shadow hanya none tak bentrok shadow.focus
- T1: tabel survey di report berisi angka brutal pre-revert (tabel deviasi sudah benar)

Task 2 (Spec2): complete (commits 9e9a81c..52fa596, spec PASS, quality fix wave 1, 426 test)

## Minor findings Spec 2 (lanjutan)
- T2: regex Layer A lebih sempit dari spek (shadow-xs/inner/rounded-[1.25rem] lolos) - belum ada pelanggaran hari ini, perluas sebelum T3
- T2: file pending PASS normal (bukan todo) - kode menang, catatan proses
- T2: strip komentar bisa menyembunyikan pelanggaran bila URL // di baris sama - belum terjadi
- T2: tak ada larangan literal backdropFilter blur (rekrusemen bisa lolos di T3)
- T2: hex 8 digit #RRGGBBAA lolos aturan hex
- T2: FloatingParticles dobel sumber (theme radius + colors prop) - disengaja, diff minimal

Task 3 (Spec2): complete (commits f40d2a1..9123c10, spec PASS, quality APPROVED, 426 test, 3 penguatan Layer A)

## Minor findings Spec 2 (lanjutan)
- T3: boxShadow literal dalam ternary/template luput dari regex quote-anchored - pindah ke T4 (penguatan)
- T3: rounded-[bracket] tidak tertangkap - sifatnya sama, pindah ke T4
- T3: filter (sepia luxe), outline, textShadow di luar daftar Layer A - kandidat amandemen spek; sepia mungkin jadi token tanda tangan Luxe
- T3: hex 4 digit #RGBA lolos
- T3: blur-[120px] dekoratif di luar aturan; glow token siap jadi target setelah aturan ada
- T3: sudut bezel glass (image2rem vs card1.5rem) membentuk wedge ~4px - cek visual di T5
- T3: halo dot timeline + bayangan alternasi testimoni hilang (aturan 1 bayangan/tema) - jalur pemulihan slot shadow.ring masa depan
- T3: drop-shadow-sm ikut regex (0 kejadian)

Task 5 (Spec2): complete (commits 6179268..31cb6c1, kontras 12/12, token onPrimary additive,455 test, dikerjakan controller - subagent batal)
Task 6 (Spec2): complete (commits 31cb6c1..6f4d8ca, fontUrl Google-only + ThemeFonts preview2 cabang,459 test)

## Deviasi/kekhawatiran batch A
- BuilderEditor ternyata form akordeon tanpa kanvas - ThemeFonts cukup di preview (asumsi plan salah)
- focusRing brutal/luxe hex lama (lolos >=3.0); sinkron ke primary baru ditunda
- colors.accent brutal #FFCC00 di luar pasangan uji (spek hanya .primary)
- 12 situs ganti white->onPrimary; lihat laporan task-5-6-report.md

