# Google OAuth: Memperbaiki `redirect_uri_mismatch` (Error 400)

## Apa artinya

Google menolak proses login karena **redirect URI** yang dikirim aplikasi
(alamat callback NextAuth) tidak sama persis dengan salah satu URI yang
terdaftar di Google Cloud Console untuk OAuth Client ini. URI yang dikirim
selalu berbentuk:

```
{origin}/api/auth/callback/google
```

dengan `{origin}` mengikuti alamat yang sedang dibuka user. Jadi
`http://localhost:3000`, `https://aicareerhub.com`, dan
`https://www.aicareerhub.com` adalah tiga URI yang BERBEDA bagi Google,
termasuk perbedaan `localhost` vs `127.0.0.1` dan perbedaan port.

Catatan: `src/lib/auth.ts` sudah memakai `trustHost: true`, jadi origin
selalu mengikuti host yang diakses user (bukan dari variabel env yang bisa
salah). Ini memastikan hanya daftar URI di bawah yang perlu benar.

## Cara memperbaiki (5 menit)

1. Ulangi login sampai error muncul, lalu klik **"lihat detail error"**
   pada halaman Google. Di situ ada baris `redirect_uri=...`.
2. Salin nilai itu apa adanya (termasuk `http/https`, port, dan tanpa
   trailing slash).
3. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   → pilih project → **APIs & Services** → **Credentials**.
4. Klik nama **OAuth 2.0 Client ID** yang dipakai aplikasi (yang Client ID-nya
   sama dengan `AUTH_GOOGLE_ID` di `.env.local`).
5. Di bagian **Authorized redirect URIs**, klik **Add URI**, tempel nilai dari
   langkah 2. Tambahkan juga URI standar berikut (satu per baris):

   ```
   http://localhost:3000/api/auth/callback/google
   http://127.0.0.1:3000/api/auth/callback/google
   https://aicareerhub.com/api/auth/callback/google
   https://www.aicareerhub.com/api/auth/callback/google
   ```

   (Tambahkan juga URL preview Vercel jika ingin login dari deployment
   preview: `https://<nama-preview>.vercel.app/api/auth/callback/google`.)

6. Klik **Save**. Perubahan biasanya aktif dalam beberapa detik sampai
   ~5 menit. Coba login lagi.

## Checklist jika masih gagal

- [ ] Bandingkan **persis** karakter per karakter: `http` vs `https`,
      `localhost` vs `127.0.0.1`, ada/tidak `www`, port berbeda, atau
      trailing slash. Google tidak mentoleransi satu karakter pun.
- [ ] Pastikan `AUTH_GOOGLE_ID` di `.env.local` (lokal) dan di Environment
      Variables hosting adalah Client ID dari OAuth client yang SAMA dengan
      yang kamu edit di Console.
- [ ] Kalau pernah membuat OAuth client baru, pastikan `AUTH_GOOGLE_SECRET`
      juga dari client yang baru.
- [ ] Cek halaman **OAuth consent screen** tidak dalam status butuh
      verifikasi untuk domain production.
- [ ] Jangan set `AUTH_URL` kecuali sangat perlu. Dengan `trustHost: true`,
      mengosongkan `AUTH_URL` membuat origin otomatis mengikuti alamat yang
      diakses. `AUTH_URL` yang salah adalah penyebab paling umum mismatch
      kedua ("kok cuma localhost yang bisa login?").

## Verifikasi cepat dari terminal

```bash
curl -s https://aicareerhub.com/api/auth/providers
```

Kalau mengembalikan JSON berisi `"google"`, berarti endpoint auth production
hidup. Mismatch tetap hanya bisa diperbaiki dari Console seperti langkah di
atas (butuh akses akun Google pemilik project).
