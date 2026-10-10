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

## Progress

Task 1: complete (commits b8dd9ff..cdbfecd, spec PASS, quality APPROVED, 115 test, 4 fix wave)
Task 2: complete (commits cdbfecd..8b6810e, spec PASS, quality APPROVED, 241 test, 3 fix wave)
Task 3: complete (commits 8b6810e..4037944, spec PASS, quality APPROVED, 272 test, 0 fix wave)