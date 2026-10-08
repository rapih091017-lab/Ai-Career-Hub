import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { referralClicks, referralConversions } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { applyAffiliate, getAffiliate } from "@/lib/affiliate.server";

/**
 * GET /api/affiliate: status program affiliate milik user.
 * - status "none": belum pernah mendaftar
 * - status "pending": menunggu review admin
 * - status "rejected": ditolak (bisa ajukan ulang lewat POST)
 * - status "approved": dashboard lengkap (kode, klik, konversi, komisi)
 */
export const GET = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const affiliate = await getAffiliate(auth.userId);
  if (!affiliate) {
    return NextResponse.json({ status: "none" });
  }
  if (affiliate.status === "pending") {
    return NextResponse.json({ status: "pending", appliedAt: affiliate.createdAt });
  }
  if (affiliate.status === "rejected") {
    return NextResponse.json({ status: "rejected", reviewedAt: affiliate.reviewedAt });
  }

  const [clickCount] = await db
    .select({ value: count() })
    .from(referralClicks)
    .where(eq(referralClicks.affiliateId, affiliate.id));

  const [aggregate] = await db
    .select({
      total: count(),
      pendingAmount: sql<number>`coalesce(sum(case when ${referralConversions.status} = 'pending' then ${referralConversions.rewardAmount} else 0 end), 0)`,
      paidAmount: sql<number>`coalesce(sum(case when ${referralConversions.status} = 'paid' then ${referralConversions.rewardAmount} else 0 end), 0)`,
    })
    .from(referralConversions)
    .where(eq(referralConversions.affiliateId, affiliate.id));

  const conversions = await db
    .select({
      id: referralConversions.id,
      rewardAmount: referralConversions.rewardAmount,
      status: referralConversions.status,
      createdAt: referralConversions.createdAt,
      paidAt: referralConversions.paidAt,
    })
    .from(referralConversions)
    .where(eq(referralConversions.affiliateId, affiliate.id))
    .orderBy(desc(referralConversions.createdAt))
    .limit(30);

  return NextResponse.json({
    status: "approved",
    code: affiliate.code,
    clicks: Number(clickCount.value),
    totalConversions: Number(aggregate.total),
    pendingAmount: Number(aggregate.pendingAmount),
    paidAmount: Number(aggregate.paidAmount),
    conversions,
  });
});

/** POST /api/affiliate: mendaftar program affiliate (atau ajukan ulang setelah ditolak). */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : null;

  // Data rekening dipakai admin untuk mencairkan komisi; dikirim saat daftar.
  const bank = {
    bankName: typeof body?.bankName === "string" ? body.bankName.trim().slice(0, 100) || null : null,
    bankAccountNumber:
      typeof body?.bankAccountNumber === "string" ? body.bankAccountNumber.trim().slice(0, 50) || null : null,
    bankAccountHolder:
      typeof body?.bankAccountHolder === "string" ? body.bankAccountHolder.trim().slice(0, 150) || null : null,
  };

  const affiliate = await applyAffiliate(auth.userId, note, bank);
  return NextResponse.json({ status: affiliate.status }, { status: 201 });
});