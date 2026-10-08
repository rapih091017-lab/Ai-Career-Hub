import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { referralConversions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { PAYOUT_MIN_AGE_DAYS } from "@/lib/affiliate";

/** POST /api/admin/affiliates/payout: tandai komisi yang SUDAH matang
 * (melewati masa tunggu `PAYOUT_MIN_AGE_DAYS`) sebagai sudah dibayar.
 * Komisi yang masih baru sengaja tidak ikut agar tidak membayar pembayaran
 * yang berpotensi refund/chargeback. */
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
        sql`${referralConversions.createdAt} < now() - make_interval(days => ${PAYOUT_MIN_AGE_DAYS})`,
      ),
    )
    .returning({ id: referralConversions.id });

  return NextResponse.json({
    updated: updated.length,
    minAgeDays: PAYOUT_MIN_AGE_DAYS,
  });
});
