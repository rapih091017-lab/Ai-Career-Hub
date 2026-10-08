import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { referralClicks, referralConversions } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { applyAffiliate, getAffiliate } from "@/lib/affiliate.server";
import {
  bankLabelFromValue,
  isValidAccountHolder,
  isValidAccountNumber,
  isValidBank,
  normalizeAccountNumber,
} from "@/lib/affiliate";

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

  // Data rekening dipakai admin untuk mencairkan komisi. Validasi ketat di
  // server: bank harus dari daftar resmi (whitelist), nomor hanya digit
  // 8-20 karakter, dan nama pemilik hanya huruf/tanda umum.
  const bankValue = typeof body?.bank === "string" ? body.bank.trim() : "";
  const accountNumber =
    typeof body?.bankAccountNumber === "string" ? body.bankAccountNumber : "";
  const holder = typeof body?.bankAccountHolder === "string" ? body.bankAccountHolder.trim() : "";

  if (!isValidBank(bankValue) || !isValidAccountNumber(accountNumber) || !isValidAccountHolder(holder)) {
    return errorResponse(
      "INVALID_BANK",
      "Data rekening belum valid. Pilih bank dari daftar, isi nomor rekening 8-20 digit, dan nama pemilik sesuai buku tabungan.",
      400,
    );
  }

  const bank = {
    bankName: bankLabelFromValue(bankValue),
    bankAccountNumber: normalizeAccountNumber(accountNumber),
    bankAccountHolder: holder,
  };

  const affiliate = await applyAffiliate(auth.userId, note, bank);
  return NextResponse.json({ status: affiliate.status }, { status: 201 });
});