/**
 * Helper keamanan untuk konten portfolio (export HTML & publish).
 * Semua user content WAJIB melewati esc() / safeUrl() sebelum masuk ke HTML.
 */

/** Escape HTML entities, wajib untuk semua user content (anti-XSS). */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Backslash atau karakter kontrol ASCII (0x00-0x1F, 0x7F). */
const URL_UNSAFE_CHARS = /[\x00-\x1f\x7f\\]/;

/**
 * Resolusi URL mentah: trim, tolak karakter tidak aman, lalu kembalikan URL
 * yang sudah tervalidasi TANPA esc(). `""` berarti ditolak.
 */
function resolveUrl(v: string): string {
  const t = v.trim();
  if (URL_UNSAFE_CHARS.test(t)) return "";
  if (/^\/(?!\/)/.test(t)) return t;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return t;
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(t)) return "https://" + t;
  return "";
}

/**
 * Validasi & sanitasi URL. Menerima http/https/mailto/tel, path relatif yang
 * diawali `/`, dan domain telanjang (diberi prefiks https://).
 * Skema lain — javascript:, data:, vbscript:, file: — ditolak dengan "".
 * `//host` (protocol-relative) juga ditolak: di href itu resolve ke origin lain.
 *
 * Backslash dan karakter kontrol ASCII ditolak sebelum cek path relatif: browser
 * menormalkan `\` jadi `/` dan meng-strip tab/newline dari URL, sehingga
 * `/\evil.com` dan `/<TAB>/evil.com` berakhir jadi `//evil.com` (origin lain).
 *
 * KONTEKS: output-nya sudah di-esc untuk disisipkan sebagai nilai atribut di
 * string HTML (jalur export/preview mandiri). Untuk JSX/React jangan pakai ini —
 * React menulis atribut lewat setAttribute tanpa parser HTML, jadi `&` akan
 * ter-escape dua kali (`&amp;amp;`). Gunakan `safeUrlUnescaped` di sana.
 *
 * Hasil fungsi ini juga jangan pernah diberi ke fetch() atau CSS url() — di sana
 * `&amp;` bukan pemisah query. Untuk kedua kasus itu pakailah `safeUrlUnescaped`.
 */
export function safeUrl(v: string): string {
  return esc(resolveUrl(v));
}

/**
 * Validasi URL yang sama persis dengan `safeUrl`, tapi TIDAK meng-escape hasil.
 *
 * KONTEKS: komponen React (`SafeLink`, `SafeImg`) yang meneruskan nilai ke
 * atribut href/src. React sudah meng-escape nilai atribut sendiri, jadi
 * meng-escape di sini justru merusak URL — `&` jadi `&amp;amp;`.
 * `safeUrl` tetap ada karena jalur export membangun string HTML secara manual,
 * di situ tidak ada React yang menolong meng-escape.
 */
export function safeUrlUnescaped(v: string): string {
  return resolveUrl(v);
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
