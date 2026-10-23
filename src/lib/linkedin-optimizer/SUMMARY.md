# LinkedIn Optimizer — keputusan & implementasi

Catatan dari diskusi 23 Okt 2026, diperbarui setelah implementasi.

## Keputusan produk

| Aspek | Keputusan |
|---|---|
| Posisi | Fitur baru, halaman sendiri. Bukan bagian dari CV checker. |
| Route | `/linkedin-optimizer` (upload) dan `/linkedin-optimizer/[id]` (hasil tersimpan). |
| Input | Field form "mau branding sebagai apa" + resume PDF (atau tempel teks). |
| Urutan hasil | Score breakdown dulu, baru rewrite per bagian. |
| Bahasa | Indonesia, mengikuti bahasa resume. |
| Rewrite | Headline, About, Experience per role, Skills. Siap tempel, tombol salin per bagian. |
| Fakta | Tidak mengarang. Data yang tidak ada → placeholder `[angka]`, `[persen]`, `[jumlah]`. |
| Model | DeepSeek lewat `src/lib/ai/adapter.ts`. |
| Riwayat | Tersimpan di database, tampil di halaman upload dan dashboard. |
| Kuota | Jatah fitur `cv_analyzer` yang sama dengan CV checker, dihitung terpisah (`usage_logs.action_type = "linkedin_optimizer"`). Tamu 2x gratis. |

## Yang sudah dibangun

- **DB**: tabel `linkedin_optimizations` di `src/db/schema/index.ts`. Migrasi: `drizzle/0026_linkedin_optimizations.sql`.
- **Skema + prompt**: `src/lib/ai/prompts/schemas.ts` (`linkedin_optimizer`) dan `src/lib/ai/prompts/linkedin-optimizer.ts`.
- **Mapper**: `src/lib/linkedin-optimizer/result.ts` — validasi ulang, dedupe bagian, skor berbobot, grade A–F.
- **API**:
  - `POST /api/linkedin-optimizer/analyze`
  - `GET /api/linkedin-optimizer/history`
  - `GET /api/linkedin-optimizer/history/[id]` (pemilik akun atau anonId yang sama)
- **Halaman**: `src/app/linkedin-optimizer/page.tsx`, `src/app/linkedin-optimizer/[id]/page.tsx`.
- **Komponen**: `src/components/linkedin/` (`LinkedInResultView`, `ScoreBreakdown`, `RewriteCard`).
- **Navigasi & teks**: entri di `src/lib/nav-items.ts`, kunci `lo.*` di `src/lib/i18n.tsx`, judul di `TitleUpdater`.
- **Riwayat**: daftar di halaman upload dan bagian baru di dashboard.
- **Test**: `linkedin-optimizer-result.test.ts` (mapper) dan `linkedin-optimizer-view.test.tsx` (render hasil).

## Migrasi & verifikasi

Migrasi sudah dijalankan ke database Neon (23 Okt 2026) memakai
`node scripts/apply-sql.mjs drizzle/0026_linkedin_optimizations.sql`.
Tabel dan foreign key terverifikasi, dan file SQL-nya idempoten.

`drizzle-kit generate` versi ini berhenti karena butuh TTY (prompt konflik skema),
jadi `drizzle/meta` belum memuat entri 0026. Kalau nanti menjalankan generate lagi,
pastikan tabel ini tidak dibuat dua kali.

- `tsc`, eslint (hanya warning lama di dashboard), dan 1049 test lulus.
- Halaman upload dicoba di dev server: render, validasi form, dan lebar 390px tanpa overflow.
- Satu optimasi nyata dicoba lewat API: selesai 10,8 detik, skor 53 (grade D), enam bagian,
  dua pengalaman dengan nama perusahaan asli, dan About tanpa fakta karangan.
- Halaman hasil dibuka sebagai tamu pemilik hasil: skor, grade, lima kartu rewrite, dan
  tombol salin tampil; akses dengan anonId lain mengembalikan 404.
- Baris uji sudah dihapus dari database setelah verifikasi.
