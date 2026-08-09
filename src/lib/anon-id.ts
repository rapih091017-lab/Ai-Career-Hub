"use client";

/**
 * Anonymous ID untuk fitur gratis tanpa login (mis. CV Checker).
 *
 * Setiap browser mendapat UUID unik yang disimpan di localStorage, lalu
 * dikirim sebagai header `x-anon-id`. Server memakai ini sebagai fingerprint
 * kuota — jadi kuota 2x tidak dishare antar user yang kebetulan punya
 * IP / User-Agent yang sama (masalah umum di localhost & jaringan NAT).
 */
const STORAGE_KEY = "ai-career-hub-anon-id";

let cached: string | null = null;

export function getAnonId(): string {
  if (cached) return cached;

  try {
    cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) {
      cached = crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, cached);
    }
  } catch {
    // localStorage tidak tersedia (privacy mode) — pakai id ephemeral
    cached = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  return cached;
}

/** Header helper — pakai di fetch yang butuh kuota anonim. */
export function anonIdHeaders(): Record<string, string> {
  return { "x-anon-id": getAnonId() };
}
