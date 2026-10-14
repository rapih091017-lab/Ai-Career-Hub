/**
 * Deteksi URL yang mengarah ke jaringan internal.
 *
 * HTML untuk render PDF berasal dari peramban. Tanpa penyaringan, tag
 * `<img src="http://169.254.169.254/...">` membuat Chromium mengambil alamat
 * internal dan isinya bisa ikut terbaca di PDF. Semua alamat privat, loopback,
 * dan link-local diblokir.
 */

const PRIVATE_HOST_PATTERNS: readonly RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
  /^metadata\./i,
];

export function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  if (!host) return true;
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

/** True kalau URL menunjuk ke jaringan yang tidak boleh diakses renderer. */
export function isPrivateUrl(url: string): boolean {
  // Skema inline tidak menyentuh jaringan sama sekali, jadi aman.
  if (/^(data:|blob:|about:)/i.test(url)) return false;

  // Skema lain (file, ftp, ws) tidak boleh dipakai renderer.
  if (/^(file|ftp|gopher|ws|wss):/i.test(url)) return true;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // URL rusak: tolak.
    return true;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
  return isPrivateHost(parsed.hostname);
}