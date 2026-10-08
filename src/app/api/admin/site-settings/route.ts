import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getSiteSettings, SITE_SETTING_DEFAULTS } from "@/lib/site-settings.server";

/** GET /api/admin/site-settings: semua pengaturan + daftar kunci yang valid. */
export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const settings = await getSiteSettings();
  return NextResponse.json({ settings, keys: Object.keys(SITE_SETTING_DEFAULTS) });
});

/** PUT /api/admin/site-settings: simpan perubahan pengaturan.
 * Body: { settings: Record<string, string> } — hanya kunci yang dikenal. */
export const PUT = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const incoming = body?.settings;
  if (!incoming || typeof incoming !== "object") {
    return errorResponse("INVALID_INPUT", "Format pengaturan tidak valid", 400);
  }

  const allowed = new Set(Object.keys(SITE_SETTING_DEFAULTS));
  const entries = Object.entries(incoming).filter(
    (entry): entry is [string, string] =>
      allowed.has(entry[0]) && typeof entry[1] === "string" && entry[1].length <= 2000,
  );

  if (entries.length === 0) {
    return errorResponse("INVALID_INPUT", "Tidak ada pengaturan yang dikenali untuk disimpan", 400);
  }

  for (const [key, value] of entries) {
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ settings, saved: entries.length });
});
