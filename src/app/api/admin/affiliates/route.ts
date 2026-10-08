import { NextResponse } from "next/server";
import { withAdmin, apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { affiliates, referralClicks, referralConversions, users } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { PAYOUT_MIN_AGE_DAYS } from "@/lib/affiliate";

/** GET /api/admin/affiliates: daftar affiliate + agregat klik/konversi/komisi. */
export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const rows = await db
    .select({
      id: affiliates.id,
      code: affiliates.code,
      status: affiliates.status,
      applicationNote: affiliates.applicationNote,
      bankName: affiliates.bankName,
      bankAccountNumber: affiliates.bankAccountNumber,
      bankAccountHolder: affiliates.bankAccountHolder,
      reviewedAt: affiliates.reviewedAt,
      createdAt: affiliates.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(affiliates)
    .innerJoin(users, eq(users.id, affiliates.userId))
    .orderBy(desc(affiliates.createdAt));

  const clickRows = await db
    .select({ affiliateId: referralClicks.affiliateId, value: count() })
    .from(referralClicks)
    .groupBy(referralClicks.affiliateId);

  const conversionRows = await db
    .select({
      affiliateId: referralConversions.affiliateId,
      total: count(),
      pendingAmount: sql<number>`coalesce(sum(case when ${referralConversions.status} = 'pending' then ${referralConversions.rewardAmount} else 0 end), 0)`,
      maturedAmount: sql<number>`coalesce(sum(case when ${referralConversions.status} = 'pending' and ${referralConversions.createdAt} < now() - make_interval(days => ${PAYOUT_MIN_AGE_DAYS}) then ${referralConversions.rewardAmount} else 0 end), 0)`,
      paidAmount: sql<number>`coalesce(sum(case when ${referralConversions.status} = 'paid' then ${referralConversions.rewardAmount} else 0 end), 0)`,
    })
    .from(referralConversions)
    .groupBy(referralConversions.affiliateId);

  const clickMap = new Map(clickRows.map((row) => [row.affiliateId, Number(row.value)]));
  const conversionMap = new Map(conversionRows.map((row) => [row.affiliateId, row]));

  return NextResponse.json({
    affiliates: rows.map((row) => {
      const conversion = conversionMap.get(row.id);
      return {
        ...row,
        clicks: clickMap.get(row.id) ?? 0,
        conversions: Number(conversion?.total ?? 0),
        pendingAmount: Number(conversion?.pendingAmount ?? 0),
        maturedAmount: Number(conversion?.maturedAmount ?? 0),
        paidAmount: Number(conversion?.paidAmount ?? 0),
      };
    }),
  });
});