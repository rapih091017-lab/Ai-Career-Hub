/**
 * Helper keamanan untuk konten portfolio (export HTML & publish).
 * Semua user content WAJIB melewati esc() / safeUrl() sebelum masuk ke HTML.
 */

/** Escape HTML entities — wajib untuk semua user content (anti-XSS). */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Validasi & sanitasi URL — hanya http/https/mailto/tel yang diizinkan, javascript: ditolak. */
export function safeUrl(v: string): string {
  const t = v.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return esc(t);
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return esc("https://" + t);
  return "";
}

/** Slug publik portfolio: huruf kecil, angka, tanda hubung, 3–50 karakter. */
export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{2,49}$/;

export const RESERVED_SLUGS = new Set([
  "api", "admin", "login", "register", "dashboard", "checker", "builder",
  "p", "portfolio", "profile", "settings", "billing", "payment", "blog",
  "about", "faq", "contact", "karir", "privacy", "terms", "sitemap",
  "robots", "surat-lamaran", "motivation", "preview", "live", "pricing",
  "help", "assets", "static", "_next", "favicon", "manifest", "apple-icon",
]);

export function isValidSlug(slug: string): boolean {
  if (!SLUG_REGEX.test(slug)) return false;
  return !RESERVED_SLUGS.has(slug);
}
