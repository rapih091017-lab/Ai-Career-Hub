# Deploy Vercel: Status & Panduan

**Update 8 Okt 2026 (status final):**

- **Produksi aktif di:** `https://ai-career-hub-tsrys.vercel.app`
  (alias production project `ai-career-hub`, sudah publik dan terverifikasi).
  Cache lama: alias `ai-career-hub-alpha.vercel.app` sudah tidak dipakai (404).
- **Domain `aicareerhub.com`: DILEPAS dari project** atas permintaan (belum
  siap dipakai sekarang). DNS di GoDaddy tidak diubah. Langkah ini bisa
  dikerjakan kapan saja nanti (lihat bagian "Menautkan domain" di bawah).
- **Vercel Authentication (SSO protection) dimatikan** agar alias publik bisa
  diakses. Disarankan diaktifkan kembali dalam mode "All Deployments except
  custom domains" saat domain sudah tidak dipakai, atau biarkan mati bila
  situs memang publik.
- Deploy berikutnya: cukup `git push` ke `master` (auto), atau manual:
  `npx vercel --prod` (CLI sudah login di mesin ini).

## Kenapa build pernah gagal (agar tidak terulang)

1. `vercel --prod` meng-upload folder lokal, bukan hanya isi git. File debug
   `pdf-render-check.tsx` ikut terbawa dan berisi import path absolut Windows
   (`D:/ai-career-hub/...`) sehingga `next build` gagal di Linux.
2. `.env` juga sempat ikut ter-upload.
3. Perbaikan permanen: `.vercelignore` (mengecualikan `.env*`, file debug,
   artefak) + `pdf-render-check.tsx` di-exclude dari `tsconfig.json`.

## Environment Variables (sudah terpasang & terbukti jalan)

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
`DEEPSEEK_API_KEY`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`,
`ADMIN_EMAILS`. Bukti: `/api/site-settings` di produksi mengembalikan data
dari DB Neon.

## Database

Seluruh migrasi (`0010`–`0016`) sudah diterapkan ke DB Neon yang dipakai
`.env`, dan DB itulah yang dipakai produksi. Jika nanti pindah database,
jalankan sekali:

```bash
node --env-file=.env scripts/apply-0010-job-tracker.mjs
node --env-file=.env scripts/apply-0011-0012.mjs
node --env-file=.env scripts/apply-0013-affiliate-approval.mjs
node --env-file=.env scripts/apply-0014-0015.mjs
node --env-file=.env scripts/apply-0016-star-scores.mjs
```

## Menautkan domain (kapan pun siap)

1. Vercel Dashboard -> project `ai-career-hub` -> Settings -> Domains ->
   Add `aicareerhub.com` dan `www.aicareerhub.com`.
2. Di GoDaddy (DNS): `A @ -> 76.76.21.21`, `CNAME www -> cname.vercel-dns.com`
   (domain saat ini masih diparkir, record lama harus diganti).
3. Daftarkan redirect URI Google:
   `https://aicareerhub.com/api/auth/callback/google`
   (plus versi `www`), lihat `docs/google-oauth-setup.md`.

## Verifikasi cepat

```bash
curl -s -o NUL -w "%{http_code}\n" https://ai-career-hub-tsrys.vercel.app/api/site-settings
curl -s -o NUL -w "%{http_code}\n" https://ai-career-hub-tsrys.vercel.app/tracker
curl -s -o NUL -w "%{http_code}\n" https://ai-career-hub-tsrys.vercel.app/contoh-cv
```
