"use client";

import { track as vercelTrack } from "@vercel/analytics";
import { anonIdHeaders } from "@/lib/anon-id";
import type { ClientEvent, EventProps } from "@/lib/events";

/**
 * Kirim event funnel dari browser ke POST /api/events (disimpan di
 * usage_logs) dan ke Vercel Analytics. Tidak pernah melempar dan tidak
 * ditunggu: pelacakan tidak boleh mengganggu alur pengguna.
 */
export function track(name: ClientEvent, props?: EventProps): void {
  try {
    vercelTrack(name, props);
  } catch {
    /* analytics tidak tersedia, abaikan */
  }
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...anonIdHeaders() },
      body: JSON.stringify(props ? { name, props } : { name }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* fetch tidak tersedia, abaikan */
  }
}
