import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { reviewAffiliate } from "@/lib/affiliate.server";

/** POST /api/admin/affiliates/review: approve atau reject pendaftaran affiliate.
 * Body: { affiliateId: string, action: "approve" | "reject" } */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const affiliateId = typeof body?.affiliateId === "string" ? body.affiliateId : "";
  const action = body?.action === "approve" || body?.action === "reject" ? body.action : null;

  if (!affiliateId || !action) {
    return errorResponse(
      "INVALID_INPUT",
      "affiliateId dan action (approve|reject) wajib diisi",
      400,
    );
  }

  const updated = await reviewAffiliate(affiliateId, action);
  if (!updated) {
    return errorResponse("NOT_FOUND", "Affiliate tidak ditemukan", 404);
  }

  return NextResponse.json({
    affiliate: { id: updated.id, status: updated.status },
  });
});
