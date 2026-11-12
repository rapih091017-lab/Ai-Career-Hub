/**
 * Path tujuan setelah login dari ?next=. Hanya path di origin yang sama:
 * nilai seperti "//evil.com" atau "/\\evil.com" (browser membacanya sebagai
 * host lain) ditolak. Mengembalikan path+query+hash, atau null.
 */
export function safeNextPath(raw: string | null | undefined, origin: string): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin || !url.pathname.startsWith("/")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
