import { NextResponse } from "next/server";
import { withAdmin, apiHandler } from "@/lib/api-utils";

/**
 * GET /api/me/role: apakah user yang login termasuk admin.
 * Dipakai UI untuk menampilkan menu admin hanya pada akun admin; penegakan
 * sebenarnya tetap di setiap endpoint admin (withAdmin).
 */
export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  return NextResponse.json({ isAdmin: !(auth instanceof NextResponse) });
});
