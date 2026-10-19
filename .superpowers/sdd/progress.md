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

Task 7+8 (Spec2): complete (commits 2fb3803..8e37655, re-compose6x3 + sweep EN->ID + Layer C guard,471 test, subagent sukses)
- flake 1x tak terulang (2 run bersih), visual via render statis bukan preview live, Tools/Project Selesai per konvensi i18n

Task 9+10 (Spec2): complete (commits 4c7ecdc..964278d + gate tanpa perbaikan,474 test, controller inline - subagent batal)
- SSR /portfolio client-gated; kebenaran thumbnail dibuktikan test jsdom bukan SSR

## SEMUA 10 TASK SPEC 2 SELESAI - tinggal review akhir cabang



## Spec 2.5 - Tema Minimalist + Hero (Selesai)

Commit: b57c538 (token) -> 6b40163 (hero) -> c40351f -> fd7e1a7 (12 section) -> 4fd8c93 (copy).
Spec: docs/superpowers/specs/2026-10-12-portfolio-minimalist-design.md
Plan: docs/superpowers/plans/2026-10-12-portfolio-minimalist.md

- Token minimalist: putih/ink, Instrument Sans, radius 0, blur none, shadow none. Token baru radii.circle (semua tema) supaya lingkaran hero tidak butuh borderRadius literal.
- Hero: MinimalistHero (lingkaran + nama raksasa + bio, tanpa h-screen) + audit 3 hero lama: Luxe dibuang kartunya, Glass diberi scrim.
- 12 section punya case minimalist (termasuk stats/skills/testimonials yang semula direncanakan token-only - koreksi tercatat di spec section 6).
- Copy 3 -> 4 tema di pricing, landing, spotlight. Default tetap Glass, tanpa migrasi DB.
- Test: 494 passed (1 skipped = harness QA), tsc 0, lint 0 error, build sukses.
- Catatan QA: harness jsdom membuang nilai clamp() untuk semua tema, jadi skala tipografi harus diverifikasi di browser, bukan dari screenshot harness.

---

# SDD Progress - Spec 3: POV HR di Hasil Checker

Plan: docs/superpowers/plans/2026-10-18-checker-hr-point-of-view.md
Spec: docs/superpowers/specs/2026-10-18-checker-hr-point-of-view-design.md
Branch: master (user menyetujui lanjut di master + push)
Base commit: 3980140

## Keputusan pre-flight

- User memilih eksekusi di master, bukan branch/worktree (sesuai pola kerja sesi ini)
- Plan Task 1 Step 6 menyalin logika ke dalam test -> diubah jadi menguji splitCvJd asli
- Reviewer Task 1 menemukan PROMPT_MARKERS.legacyJd sebagai key ketiga; implementer menyimpang dari kontrak "Produces" brief. Disetujui: tanpa key itu, penanda lama harus ditulis literal di adapter dan grep anti-drift akan gagal.

## Minor findings yang ditunda ke review akhir

- T1: startsWith adalah cocok prefiks, bukan cocok baris; CV yang diawali === CV KANDIDAT ===X menyisakan X (regex baris akan lebih tepat)
- T1: CRLF tidak ditangani di regex kategori posisi + startsWith; tidak terjangkau sekarang (template route pakai \n), degradasi senyap kalau format prompt berubah
- T1: splitCvJd("") dan CV yang isinya hanya marker belum di-assert (perilaku sudah benar)
- T1: satu test (penanda JD = inisialisasi konstantanya sendiri) nyaris tautologis; kerja grunt disimpan oleh assertion grep
- T1: test eadFileSync bergantung cwd = root repo (cocok dengan konvensi plan lain)
- T1: CV yang teksnya sendiri memuat penanda JD lawas masih memotong batas lebih awal. Disepakati sebagai limitasi, bukan bug yang bisa diperbaiki di sini: pemisahan berbasis konten dari teks tak tepercaya memang bisa dipalsukan. Perbaikan durables: berhenti data terstruktur lewat string, dan mengoper {cv, jd} ke callAI (perubahan interface, butuh task sendiri).
- T1: nalysis-v4.ts masih menulis penanda sebagai literal di template sistem jadi sumber kebenaran kedua yang tidak dibaca grep anti-drift. Dibawa ke Task 2 (file itu sudah diubah di sana).

## Progress

Task 1: complete (commits 3980140..15c57cd, spec PASS, quality APPROVED setelah 1 fix wave, 842 test)
Task 2: complete (commits 15c57cd..e93f4f0, spec PASS, quality APPROVED setelah 3 fix wave, 857 test)

## Minor findings Task 2 yang ditunda ke review akhir

- T2: nalysis-v4.ts dua versi prompt v3/v4 punya angka en-dash vs hyphen pada tabel GRADE; semantik sama
- T2: test GRADE memakai regex readFileSync yang bergantung CWD (konvensi repo)
- T2: cakupan penjaga penyuntikan hanya \dapter.ts\ + \src/app/api/**/route.ts\; \src/lib/pdf-export.ts\ di luar, bukan Assemble prompt
- T2: aturan penjaga sengaja lebih luas dari "data pengguna" (semua argumen non-literal) demi kesederhanaan
- T2: \checker-grade-prompt.test.ts\ tidak diakhiri newline
- T2: file \cv-documents/create/route.ts\ masih punya 2 pelanggaran pola ganti-string yang tercatat di daftar pengecualian (tidak eksploitable sekarang: nilainya dari new Date() dan string tervalidasi)
- T2: penyusun AST memakai heuristik regex-vs-pembagian sendiri di ambang parser; sementara, tapi dalam repo nyata nol positive palsu

Task 3: complete (commits 10d8a49..7e6d7d7, spec PASS, quality APPROVED setelah 2 fix wave, 876 test)

## Minor findings Task 3 yang ditunda ke review akhir

- T3: type \AnalysisResult.breakdown\ tetap lima section wajib untuk halaman live; storagenya memakai tipe \StoredBreakdown\ terpisah yang boleh sebagian
- T3: \meta\/\careerVelocity\/\tsPredictionDetail\ diteruskan tanpa validasi (tidak ada klaim angka) -> Task 4 wajib menormalkan bentuknya
- T3: \weightsApplied\/\impactForecast\ jadi null kalau tidak lengkap, jadi catatan bobot dan kartu proyeksi hilang diam-diam pada baris rusak
- T3: test route untuk aiModel berupa assertion teks sumber (ikut konvensi checker-read-speed.test.ts); false-positive kalau nama variabel diganti
- T3: helper \acaSepertiHalaman\ di file test adalah snapshot akses halaman; akan lapuk diam-diam kalau halaman berubah (rekomendasi: render test dengan jsdom)
- T3: \isk_factors\正确的 tipe union hanya dijaga tsc, bukan test runtime (runtime passthrough tidak berubah)

Task 4: complete (commits 7e6d7d7..7c0b1d8, spec PASS, quality APPROVED, 889 test, 0 fix wave)

## Minor findings Task 4 yang ditunda ke review akhir

- T4: \isEmpty\ hanya soal daftar temuan, jadi hasil yang punya seniority/progression tapi nol temuan akan/isEmpty true -> Task 5 tidak boleh menyembunyikan seluruh isi panel hanya karena itu
- T4: dua pemetaan item risk_factors dan strengths nyaris kembar; satu helper lokal akanvr现实中缩小 permukaan
- T4: test "ats_prediction berupa string tidak bikin error" hampa secara函数 — fungsi memang tidak membaca field itu; diwarisi dari brief
- T4: jalur tanpa test: meta bukan objek, item null di dalam array
- T4: komentar field \quote\ bilang "kalimat asli dari CV" padahal nilainya sudah di-trim
- T4: memotong kutipan aman untuk pencocokan teks (trim(x) ⊆ x), tapi hanya selama tidak ada yang membandingkan byte-equality

Task 5: complete (commits 7c0b1d8..HEAD, spec PASS, quality APPROVED setelah 1 fix wave + 1 keputusan copy controller, 905 test)

Catatan penting Task 5:
- \	ext-headline-sm\ dan \	ext-body-sm\ bukan token di tailwind.config.ts. Karena preflight mewarisi ukuran body, judul panel h2 tampil 16px weight 400 dan hierarkinya terbalik terhadap h3 kolom. Sudah diganti token asli.
- Judul kolom kanan diubah jadi "Yang bikin saya lanjut baca" (tanpa "baca" meanings-nya jadi setujui/lanjut, bukan lanjut membaca).
- Trajectory "Perjalanan" -> "Arah karier" karena "Perjalanan" bukan padanan "Trajectory".
- Kolom kosong dapat kalimat sendiri supaya tidak terlihat rusak.
- Kunci i18n bertambah jadi 10 per prefix (punya hrview-pace + hrview-stopping-empty + hrview-continuing-empty).

## Minor findings Task 5 yang ditunda ke review akhir

- T5: dua set kunci \checker.hrview-*\ dan \checker.detail.hrview-*\ sengaja identik, jadi tidak ada test yang bisa membuktikan keyPrefix terpakai
- T5: pembeda severity memakai ukuran + warna (token \	ext-label-bold text-error\ untuk Kritis), bukan \ont-bold\, karena dua utility satu layer diselesaikan urutan stylesheet
- T5: \	ext-error\ dipakai bersama; perlu dicek tidak bentrok bila panel someday|nests di dalam kartu error
- T5: dua test bahasa Inggris bergantung localStorage; jika provider nanti membaca preferensi dari tempat lain, test itu putus tanpa masalah copy
- T5: \LEVEL_LABEL\ masih mix bahasa (entry/menengah/senior/lead)

## Review akhir seluruh perubahan (final whole-branch)

Verdict awal **JANGAN RILIS** dengan 3 Critical + 5 Important. Semua sudah diperbaiki:

- C1: dua kolom yang saya instruksikan untuk dihapus ternyata BUKAN duplikat. Panel baca ats_prediction, kolom baca narrative_feedback — dua schema berbeda. areas_for_improvement kehilangan seluruh pembacanya. Diperbaiki: panel jadi satu sumber dengan fallback ke narrative_feedback. Komit 2d8fe81.
- C2: IssueOrString tanpa .catch() membuat SATU item rusak menghapus SELURUH array, lalu panel mengklaim CV tanpa temuan. Diperbaiki per item + copy kosong diubah jadi pernyataan tentang analisis, bukan tentang CV. Komit 606908f.
- C3: meta.detected_seniority/title_progression/growth_rate punya .catch() ke mid/Stable/Normal yang lolos allowlist, jadi panel menampilkan level dan arah karier yang tidak pernah dikirim AI. Diubah jadi .optional(). Komit fbce3c5.
- I3: dua halaman hasil divergen. Penjaga diterapkan ke /checker. Komit 4c2357a.
- I5: prompt masih mengetik strengths sebagai string[], jadi kutipan sisi positif biasanya kosong. Diubah jadi objek lengkap source_excerpt. Komit b55a155.
- M10: karakter banner komentar types.ts dipulihkan. Komit fd4fb32.

Total 935 test, tsc 0, build sukses.

## Sisa yang TIDAK diperbaiki (sadar, tercatat)

- I1: penanda JD di tengah CV masih memotong CV (pemisahan berbasis konten memang bisa dipalsukan dari sisi mana pun; perbaikan durables adalah berhenti meneruskan data terstruktur lewat string, yaitu perubahan interface callAI, butuh task tersendiri). Sudah terdokumentasi di Task 1.
- I2 + test section score: .catch() schema menaruh 50 ke jsonb SEBELUM normaliser, jadi penjaga "jangan tampilkan skor karangan" tidak pernah aktif untuk baris normal. Test-nya memakai input yang tidak bisa dihasilkan schema.
- M8: dua register di satu panel — kolom kosong casual, gabungan kosong formal.
- M11: tiga skrip PowerShell satu-kali ter-commit ke scripts/ (sdd-task-brief.ps1, sdd-review-package.ps1, fix-plan-dashes.ps1). Bukan tools produk; skrip ke-2 menulis CRLF sementara repo memakai LF.
- M14: "nol token baru" tidak persis — tabel GRADE menambah ~40 token per panggilan sistem.
- M13 (pre-existing): grade/verdict/ats_prediction tetap punya .catch() yang mengarang nilai kalau model mengirim nilai di luar enum. Panel sekarang duduk tepat di atas ketiganya.
