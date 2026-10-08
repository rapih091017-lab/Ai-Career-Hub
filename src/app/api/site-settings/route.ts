import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-utils";
import { getSiteSettings } from "@/lib/site-settings.server";

/** GET /api/site-settings: pengaturan publik (kontak & sosial media) untuk
 * dipakai halaman kontak dan footer tanpa perlu hardcode di kode. */
export const GET = apiHandler(async () => {
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
});
