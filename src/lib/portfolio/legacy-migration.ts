"use client";

import {
  portfolioDataSchema,
  URL_FIELD_MESSAGE,
  type ValidatedPortfolioData,
} from "./schema";

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

function readAt(root: unknown, path: ReadonlyArray<PropertyKey>): unknown {
  let node = root;
  for (const key of path) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<PropertyKey, unknown>)[key];
  }
  return node;
}

function writeAt(root: unknown, path: ReadonlyArray<PropertyKey>, value: unknown): void {
  if (path.length === 0) return;
  let node = root;
  for (const key of path.slice(0, -1)) {
    if (!node || typeof node !== "object") return;
    node = (node as Record<PropertyKey, unknown>)[key];
  }
  if (!node || typeof node !== "object") return;
  (node as Record<PropertyKey, unknown>)[path[path.length - 1]] = value;
}

/**
 * Coerce draft legacy supaya lolos schema tanpa membuang isinya:
 * URL gagal dikosongkan, pasangan tanggal yang melanggar range dibuang,
 * string lewat batas dipotong. Masalah lain dianggap tidak aman ditebak,
 * jadi kembalikan null dan data legacy tetap utuh di perangkat.
 */
export function migrateLegacyPayload(legacy: unknown): ValidatedPortfolioData | null {
  if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) return null;
  let current: unknown = structuredClone(legacy);
  // Beberapa lewat perbaikan: potongan URL bisa tetap gagal lalu dikosongkan.
  for (let pass = 0; pass < 5; pass++) {
    const parsed = portfolioDataSchema.safeParse(current);
    if (parsed.success) return parsed.data;
    let fixed = false;
    for (const issue of parsed.error.issues) {
      if (issue.path.length === 0) return null;
      if (issue.code === "too_big" && issue.origin === "string" && typeof issue.maximum === "number") {
        const value = readAt(current, issue.path);
        if (typeof value !== "string") return null;
        writeAt(current, issue.path, value.slice(0, issue.maximum));
        fixed = true;
      } else if (issue.code === "custom" && issue.message === URL_FIELD_MESSAGE) {
        writeAt(current, issue.path, "");
        fixed = true;
      } else if (issue.code === "custom" && /tanggal (selesai|lulus)/i.test(issue.message)) {
        writeAt(current, [...issue.path, "startDate"], "");
        writeAt(current, [...issue.path, "endDate"], "");
        fixed = true;
      } else {
        return null;
      }
    }
    if (!fixed) return null;
  }
  return null;
}

/** Aturan hapus kunci legacy: hanya setelah isinya berhasil dimigrasi,
 *  atau kalau memang tidak ada isinya. */
export function shouldClearLegacy(
  legacy: unknown,
  migrated: ValidatedPortfolioData | null,
): boolean {
  return legacy === null || migrated !== null;
}
