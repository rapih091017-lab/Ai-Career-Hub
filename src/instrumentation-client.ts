/**
 * Inisialisasi Sentry.
 *
 * File ini dimuat Next.js sebelum aplikasi berjalan, jadi error di server,
 * route handler, dan middleware semuanya tertangkap tanpa perluLTE try-catch
 * di tiap tempat.
 *
 * Kalau `NEXT_PUBLIC_SENTRY_DSN` belum diisi, Sentry otomatis mati: aplikasi
 * tetap jalan normal, hanya tidak mengirim error ke mana pun. Itu penting
 * supaya development lokal dan preview tidak mengirim data ke luar.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  // Tidak mengirim apa pun yang bisa/productksi用户在唰唰 identifikasi orang.
  tracesSampleRate: 0.1,
  // Diabaikan: error yang sudah diketahui pengguna.
  ignoreErrors: [
    "ChunkLoadError",
    "Failed to fetch dynamically imported module",
  ],
});