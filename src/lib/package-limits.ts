/**
 * Normalisasi `limits` paket.
 *
 * `limits` disimpan sebagai kolom jsonb, tapi beberapa baris pernah tersimpan
 * sebagai teks JSON (hasil impor atau penulisan manual). Kalau bentuk teks itu
 * tidak diparsing, `limits.cv_analyzer` bernilai undefined: paket yang sudah
 * dibayar tidak membuka fiturnya, dan penggabungan kuota ikut salah karena
 * `Object.entries()` membaca karakter demi karakter.
 *
 * Modul ini murni supaya bisa diuji tanpa database.
 */

export type PackageLimits = Record<string, number | "unlimited" | false>;

/** Ubah jsonb berupa objek maupun teks JSON menjadi objek limits. */
export function normalizePackageLimits(value: unknown): PackageLimits | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as PackageLimits)
        : null;
    } catch {
      return null;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as PackageLimits;
  }

  return null;
}

/** True kalau limits sudah berbentuk objek, bukan teks. */
export function isLimitsObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}