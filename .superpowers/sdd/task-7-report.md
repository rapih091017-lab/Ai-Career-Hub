# Task 7 Report: Migrasi 0022 — tabel `portfolio_assets`

## Yang berubah

1. **`src/db/schema/index.ts`**
   - Tambah `customType` ke import `drizzle-orm/pg-core`.
   - Deklarasi `bytea` via `customType` (drizzle-orm 0.45.2 tidak punya bytea bawaan; grep `bytea|customType` di `src/db` → tidak ada konvensi eksisting, jadi dibuat baru):
     ```ts
     const bytea = customType<{ data: Buffer; driverData: Buffer }>({
       dataType() { return "bytea"; },
     });
     ```
   - Tambah `portfolioAssets` pgTable sesuai brief, dengan array-style callback untuk index (mengikuti koreksi Task 6).

2. **`drizzle/0022_portfolio_assets.sql`** — CREATE TABLE, dua index (`portfolio_assets_user_sha_idx` UNIQUE, `portfolio_assets_user_idx`), FK `portfolio_assets_user_id_users_id_fk` mengikuti konvensi penamaan Task 6. Guard `CREATE INDEX IF NOT EXISTS` + `DO $$` untuk FK, format `statement-breakpoint` seperti 0021.

3. **`scripts/apply-0022-portfolio-assets.mjs`** — salin pola 0021 (`postgres` client, bukan `pg`), hanya path file dan query verifikasi yang berbeda.

## Perintah & output nyata

```
$ npx tsc --noEmit
tsc exit: 0

$ node --env-file=.env scripts/apply-0022-portfolio-assets.mjs
OK: drizzle/0022_portfolio_assets.sql
0022 selesai. Baris portfolio_assets: 0

$ # verifikasi index + FK (script sementara dihapus setelah dijalankan)
indexes: ['portfolio_assets_pkey','portfolio_assets_user_idx','portfolio_assets_user_sha_idx']
fk: ['portfolio_assets_user_id_users_id_fk']
```

## Penanganan bytea

`pg-core` 0.45.2 tidak mengekspor tipe bytea. Dideklarasikan `customType` di bagian atas `schema/index.ts` dengan `dataType: "bytea"` dan `Buffer` untuk `data`/`driverData`. Catatan: `postgres` (porsager) menangani Buffer ↔ bytea secara native, jadi tidak perlu custom `toDriver`/`fromDriver`.

## Deviasi dari brief

- Nama FK: `portfolio_assets_user_id_users_id_fk` (bukan `portfolio_assets_user_id_users_fk` di brief) — konsisten dengan koreksi Task 6.
- SQL pakai `CREATE INDEX IF NOT EXISTS` + `statement-breakpoint` (gaya 0021), bukan `DO $$` blok untuk index.
- `customType` dikomentari singkat (bahasa Indonesia) menjelaskan alasan, mengikuti gaya komentar skema lain.

## Kekhawatiran

- Tidak ada. Blob disimpan inline bytea; ukuran baris besar (mis. gambar MB) tetap oke untuk kasus penggunaan ini, tapi kalau file rata-rata membesar, pertimbangkan object storage nanti.
