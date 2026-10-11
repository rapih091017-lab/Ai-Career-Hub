"use client";

/**
 * Migrasi draft lama yang hanya hidup di localStorage perangkat user.
 * Dua kunci legacy dipindah sekali ke draft server, lalu dihapus supaya
 * tidak ada lagi pembacaan kunci lama di jalur reguler builder/preview.
 *
 * Kunci sengaja dipusatkan di sini (bukan di halaman) supaya halaman
 * build/live/preview bebas dari literal kunci lama.
 */
const LEGACY_KEYS = ["portfolio_live_data", "portfolio_draft"] as const;

/** Baca draft legacy pertama yang ada dan bisa diparse sebagai objek. */
export function readLegacyDraft<T>(): T | null {
  if (typeof window === "undefined") return null;
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      // Kunci rusak/bukan JSON: lewati, coba kunci berikutnya.
    }
  }
  return null;
}

/** Hapus kedua kunci legacy setelah draft server berhasil dibuat. */
export function clearLegacyDraft(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Diabaikan: tidak menggagalkan alur.
    }
  }
}
