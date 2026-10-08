/**
 * Pengaturan situs: nilai default + pembacaan dari DB dengan fallback.
 * Kunci sengaja berupa daftar tertutup (whitelist) supaya API admin hanya
 * bisa menulis pengaturan yang dikenal.
 */
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

export const SITE_SETTING_DEFAULTS: Record<string, string> = {
  site_name: "AI Career Hub",
  contact_email: "support@aicareerhub.com",
  contact_whatsapp: "",
  social_handle: "@aicareerhub",
  social_instagram: "",
  social_linkedin: "",
  footer_note: "",
};

export type SiteSettings = Record<string, string>;

/** Baca pengaturan; DB error (mis. saat build) jatuh ke nilai default. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const merged: SiteSettings = { ...SITE_SETTING_DEFAULTS };
  try {
    const rows = await db.select().from(siteSettings);
    for (const row of rows) {
      if (row.value !== null) merged[row.key] = row.value;
    }
  } catch {
    // Diamkan: halaman tetap tampil dengan default.
  }
  return merged;
}
