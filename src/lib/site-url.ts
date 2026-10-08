/**
 * Basis URL situs untuk metadata, canonical, sitemap, dan robots.
 * Prioritas:
 *   1. NEXT_PUBLIC_BASE_URL  — override manual (dipakai bila domain custom sudah aktif)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — domain produksi stabil yang dipilih Vercel
 *      otomatis (alias `*.vercel.app` terpendek), jadi canonical/og:image tidak
 *      berganti-ganti tiap deploy
 *   3. VERCEL_URL — URL deploy spesifik (fallback preview)
 *   4. domain produksi sebagai fallback terakhir
 * Dengan begitu canonical dan og:image selalu menunjuk ke alamat yang
 * benar-benar aktif, bukan domain yang belum tersambung.
 */
const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const withScheme = (host: string) => (host ? `https://${stripTrailingSlash(host)}` : "");

export const SITE_URL =
  (process.env.NEXT_PUBLIC_BASE_URL && stripTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL)) ||
  withScheme(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "") ||
  withScheme(process.env.VERCEL_URL ?? "") ||
  "https://ai-career-hub-tsrys.vercel.app";
