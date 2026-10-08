import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { referralConversions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** POST /api/admin/affiliates/payout: tandai semua komisi pending milik satu
 * affiliate sebagai sudah dibayar (payout manual lewat transfer). */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const affiliateId = typeof body?.affiliateId === "string" ? body.affiliateId : "";
  if (!affiliateId) {
    return errorResponse("INVALID_INPUT", "affiliateId wajib diisi", 400);
  }

  const updated = await db
    .update(referralConversions)
    .set({ status: "paid", paidAt: new Date() })
    .where(
      and(
        eq(referralConversions.affiliateId, affiliateId),
        eq(referralConversions.status, "pending"),
      ),
    )
    .returning({ id: referralConversions.id });

  return NextResponse.json({ updated: updated.length });
});
