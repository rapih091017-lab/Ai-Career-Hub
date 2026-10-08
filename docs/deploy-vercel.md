# Deploy Vercel: Langkah Manual yang Dibutuhkan

Status per commit terakhir (branch `master`):

- **GitHub**: sudah ter-push (`b8937d3` + `fae337a`). Sumber terbaru ada di
  `https://github.com/rapih091017-lab/Ai-Career-Hub`.
- **Vercel CLI dari mesin ini**: token login sudah kedaluwarsa
  ("The specified token is not valid"), jadi deploy dari sesi otomatis TIDAK
  bisa dijalankan. Perlu login ulang (langkah 1).
- **Temuan penting soal domain** (per 8 Okt 2026):
  - `aicareerhub.com` masih menunjuk ke **domain parking** (DNS ke
    `3.33.130.190` / `15.197.148.33`, body redirect ke `/lander`), bukan ke
    aplikasi. SEMUA path mengembalikan halaman parkir.
  - `ai-career-hub.vercel.app` ternyata milik aplikasi lain (title:
    `expo-app`), bukan project ini. Jadi jangan pakai URL itu untuk cek.
  - Artinya: **belum ada bukti kode terbaru berjalan di production mana pun**.
    Setelah langkah 1 selesai, hasil deploy akan memberi URL
    `https://<project>-<hash>.vercel.app` yang benar.

## 1. Deploy (sekali login, lalu satu perintah)

```powershell
cd D:\Ai-Career-Hub
npx vercel login        # pilih GitHub/email, sekali saja
npx vercel --prod       # deploy production dari folder ini
```

Project sudah ter-link di folder ini (`.vercel/project.json`,
projectId `prj_6F61EAOmz1l84emONeJ2pwQuGqr8`), jadi tidak perlu setup ulang.
Setelah selesai, catat URL production yang dicetak CLI.

## 2. Pastikan Environment Variables ada di project Vercel

Dashboard Vercel > project > Settings > Environment Variables. Wajib ada
(nilai diambil dari akun masing-masing):

- `DATABASE_URL` (Neon; lihat catatan migrasi di bawah)
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `DEEPSEEK_API_KEY`
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` (pastikan production, bukan sandbox)
- `ADMIN_EMAILS`
- Opsional: kosongkan `AUTH_URL` (kode sudah `trustHost: true`, origin otomatis).

## 3. Migrasi database production

Jika `DATABASE_URL` di Vercel menunjukkan host Neon yang sama dengan `.env`
lokal (`ep-wispy-brook-ao54pdjr-pooler...aws.neon.tech`), semua tabel sudah
siap dan langkah ini tidak perlu.

Jika berbeda, jalankan satu kali dari lokal dengan URL production:

```bash
node --env-file=.env scripts/apply-0010-job-tracker.mjs
node --env-file=.env scripts/apply-0011-0012.mjs
node --env-file=.env scripts/apply-0013-affiliate-approval.mjs
node --env-file=.env scripts/apply-0014-0015.mjs
node --env-file=.env scripts/apply-0016-star-scores.mjs
```

Semua skrip idempotent (aman dijalankan berulang).

## 4. Sambungkan domain aicareerhub.com

Dashboard Vercel > project > Settings > Domains > Add:

- `aicareerhub.com`
- `www.aicareerhub.com`

Vercel akan menampilkan instruksi DNS; standarnya:

- `A` record `@` -> `76.76.21.21`
- `CNAME` record `www` -> `cname.vercel-dns.com`

Ubah di penyedia DNS domain (tempat domain dibeli). **Domain saat ini masih
diparkir**, jadi record lama harus diganti. Propagasi umumnya beberapa menit
sampai beberapa jam.

## 5. Google OAuth production

Setelah domain aktif, daftarkan redirect URI di Google Cloud Console
(detail langkah di `docs/google-oauth-setup.md`):

```
https://aicareerhub.com/api/auth/callback/google
https://www.aicareerhub.com/api/auth/callback/google
```

Tanpa langkah ini, login Google di production tetap
`redirect_uri_mismatch`.

## 6. Checklist verifikasi setelah deploy

```bash
curl -s -o NUL -w "%{http_code}\n" https://<url-deploy>/api/site-settings   # harap 200
curl -s -o NUL -w "%{http_code}\n" https://<url-deploy>/tracker             # harap 200
curl -s -o NUL -w "%{http_code}\n" https://<url-deploy>/contoh-cv           # harap 200
```

Lalu buka di browser: login Google, cek `/tracker`, `/affiliate`, export PDF
dari `/builder`.
