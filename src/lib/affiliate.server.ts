/**
 * Helper server program affiliate: pendaftaran, review admin, dan pencatatan
 * konversi. Dipisah dari src/lib/affiliate.ts (konstanta client-safe) agar
 * import DB tidak bocor ke komponen client.
 */
import { db } from "@/db";
import { affiliates, referralConversions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AFFILIATE_REWARD_PERCENT, generateAffiliateCode } from "./affiliate";

/** Ambil data affiliate user (null jika belum pernah mendaftar). */
export async function getAffiliate(userId: string) {
  const [row] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.userId, userId))
    .limit(1);
  return row ?? null;
}

export interface AffiliateBankData {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
}

/** Daftar program affiliate (atau ajukan ulang setelah ditolak).
 * Kode dibuat saat mendaftar tapi link baru aktif setelah admin menyetujui.
 * Data rekening dipakai admin untuk mencairkan komisi. */
export async function applyAffiliate(
  userId: string,
  note: string | null,
  bank: AffiliateBankData,
) {
  const existing = await getAffiliate(userId);
  if (existing && existing.status !== "rejected") return existing;

  if (existing) {
    const [updated] = await db
      .update(affiliates)
      .set({
        status: "pending",
        applicationNote: note,
        reviewedAt: null,
        bankName: bank.bankName,
        bankAccountNumber: bank.bankAccountNumber,
        bankAccountHolder: bank.bankAccountHolder,
      })
      .where(eq(affiliates.id, existing.id))
      .returning();
    return updated;
  }

  // Retry kecil: tabrakan kode sangat jarang, dan request ganda bisa balapan.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [created] = await db
        .insert(affiliates)
        .values({
          userId,
          code: generateAffiliateCode(),
          status: "pending",
          applicationNote: note,
          bankName: bank.bankName,
          bankAccountNumber: bank.bankAccountNumber,
          bankAccountHolder: bank.bankAccountHolder,
        })
        .returning();
      return created;
    } catch {
      const again = await getAffiliate(userId);
      if (again) return again;
    }
  }
  throw new Error("Gagal mendaftar affiliate");
}

/** Approve / reject pendaftaran oleh admin. */
export async function reviewAffiliate(affiliateId: string, action: "approve" | "reject") {
  const [updated] = await db
    .update(affiliates)
    .set({
      status: action === "approve" ? "approved" : "rejected",
      reviewedAt: new Date(),
      approvedAt: action === "approve" ? new Date() : null,
    })
    .where(eq(affiliates.id, affiliateId))
    .returning();
  return updated ?? null;
}

/** Catat komisi untuk pembayaran sukses yang membawa kode referral.
 * Hanya affiliate berstatus approved yang dihitung; satu komisi per user
 * yang direfer (pembelian pertama), bukan self-referral. Idempotent lewat
 * unique index referredUserId. */
export async function createConversionForPayment(payment: {
  id: string;
  userId: string;
  amount: number;
  referralCode: string | null;
}) {
  if (!payment.referralCode) return;

  const [affiliate] = await db
    .select()
    .from(affiliates)
    .where(eq(affiliates.code, payment.referralCode))
    .limit(1);
  if (!affiliate || affiliate.status !== "approved" || affiliate.userId === payment.userId) {
    return;
  }

  const rewardAmount = Math.round((payment.amount * AFFILIATE_REWARD_PERCENT) / 100);
  if (rewardAmount <= 0) return;

  await db
    .insert(referralConversions)
    .values({
      affiliateId: affiliate.id,
      referredUserId: payment.userId,
      paymentId: payment.id,
      rewardAmount,
      status: "pending",
    })
    .onConflictDoNothing({ target: referralConversions.referredUserId });
}