import { z } from "zod";

/**
 * Event jalur konversi: landing, cek CV, builder, PDF, checkout, bayar.
 *
 * Disimpan di `usage_logs` (tabel yang sudah ada, tanpa migrasi) dengan
 * actionType berawalan `evt_`. Semua hitungan kuota memakai actionType persis
 * (`checker_check`, `cv_build`, `pdf_export`, ...), jadi baris event tidak
 * pernah terhitung sebagai pemakaian. Statistik admin yang menghitung semua
 * actionType wajib mengecualikan prefix ini lewat `EVENT_ACTION_LIKE`.
 */
export const FUNNEL_EVENTS = [
  "landing_view",
  "hero_cta_click",
  "checker_start",
  "checker_result",
  "signup",
  "builder_start",
  "pdf_download",
  "checkout_start",
  "purchase",
] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

/** Hanya dicatat server (pendaftaran, render PDF, pembayaran sukses), supaya tidak bisa dipalsukan dari browser. */
export const SERVER_ONLY_EVENTS = ["signup", "pdf_download", "purchase"] as const satisfies readonly FunnelEvent[];

export const CLIENT_EVENTS = [
  "landing_view",
  "hero_cta_click",
  "checker_start",
  "checker_result",
  "builder_start",
  "checkout_start",
] as const satisfies readonly FunnelEvent[];
export type ClientEvent = (typeof CLIENT_EVENTS)[number];

export const EVENT_ACTION_PREFIX = "evt_";
/** Pola LIKE untuk actionType event; `_` di-escape karena wildcard di SQL. */
export const EVENT_ACTION_LIKE = "evt\\_%";

export function eventActionType(name: FunnelEvent): string {
  return `${EVENT_ACTION_PREFIX}${name}`;
}

/** Nama event dari actionType, atau null bila bukan event yang dikenal. */
export function eventFromActionType(actionType: string): FunnelEvent | null {
  if (!actionType.startsWith(EVENT_ACTION_PREFIX)) return null;
  const name = actionType.slice(EVENT_ACTION_PREFIX.length);
  return (FUNNEL_EVENTS as readonly string[]).includes(name) ? (name as FunnelEvent) : null;
}

/** Batas ukuran body POST /api/events, dalam byte. */
export const EVENT_BODY_MAX_BYTES = 1024;

export type EventProps = Record<string, string | number | boolean>;

/** Properti kecil: maks 5 kunci snake_case, nilai pendek. */
export const eventPropsSchema = z
  .record(
    z.string().regex(/^[a-z][a-z0-9_]{0,23}$/),
    z.union([z.string().max(64), z.number().finite(), z.boolean()]),
  )
  .refine((props) => Object.keys(props).length <= 5, { message: "Terlalu banyak properti." });

export const eventBodySchema = z
  .object({
    name: z.enum(CLIENT_EVENTS),
    props: eventPropsSchema.optional(),
  })
  .strict();
