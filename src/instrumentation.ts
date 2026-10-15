/**
 * Inisialisasi Sentry untuk server.
 *
 * Dipisah dari versi client karena Node.js punya API yang tidak ada di
 * peramban (`onRequestError`, integrator Express/Next.js), dan impor ini
 * hanya boleh masuk ke bundel server.
 *
 * Tanpa DSN, Sentry mati dan aplikasi tidak berubah perilaku.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  tracesSampleRate: 0.1,
  ignoreErrors: [
    "ChunkLoadError",
    "Failed to fetch dynamically imported module",
  ],
});

/**
 * Error dari route handler dan server component tidak pernah sampai ke
 * instrumentation-client, jadi harus ditangkap lewat callback ini. Tanpa
 * ini, "An error occurred in the Server Components render" yang pernah kita
 * temui tidak akan pernah terlihat kalau tidak ada yang melaporkannya.
 */
export const onRequestError = Sentry.captureRequestError;