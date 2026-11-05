import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { usageLogs, payments } from "@/db/schema";
import { eq, and, count, gte, sql } from "drizzle-orm";
import { getUserAccess } from "@/lib/access";
import { apiHandler, startOfMonthUtc, QUOTA_PERIOD } from "@/lib/api-utils";

export const GET = apiHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();

  // ── 0. Dapatkan user access & limits ───────────────────────────
  const access = await getUserAccess(userId);

  // ── 0b. Hitung expiry dari semua active payments ────────────────
  const [expiryRow] = await db
    .select({ expiresAt: payments.expiresAt })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.paymentStatus, "success"),
        gte(payments.expiresAt, now),
      ),
    )
    .orderBy(sql`${payments.expiresAt} DESC`)
    .limit(1);

  const premiumExpiresAt = expiryRow?.expiresAt ?? null;

  // ── 1. Hitung usage per action type (periode sesuai QUOTA_PERIOD) ──
  const firstOfMonth = startOfMonthUtc();

  const actionTypes = ["checker_check", "ai_revision", "ai_suggestion", "cv_build", "cover_letter_generate"] as const;
  const usageMap: Record<string, number> = {};
  for (const action of actionTypes) {
    // Periode sama dengan yang ditegakkan (QUOTA_PERIOD): revisi/saran AI seumur akun.
    const where = [eq(usageLogs.userId, userId), eq(usageLogs.actionType, action)];
    if (QUOTA_PERIOD[action] === "month") where.push(gte(usageLogs.createdAt, firstOfMonth));
    const [row] = await db
      .select({ value: count() })
      .from(usageLogs)
      .where(and(...where));
    usageMap[action] = row.value;
  }

  // cv_build dihitung dari usage_logs, sumber yang sama dengan checkQuota/
  // reserveQuota. Menghitung tabel cv_documents membuat angka di halaman
  // tagihan berbeda dari yang ditegakkan (CV kosong/duplikat ikut terhitung).

  // ── 2. Ambil riwayat pembayaran sukses ───────────────────────────
  const paymentHistory = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      packageType: payments.packageType,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentStatus: payments.paymentStatus,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.paymentStatus, "success"),
      ),
    )
    .orderBy(sql`${payments.paidAt} DESC`)
    .limit(50);

  // ── 3. Ambil total pengeluaran ────────────────────────────────────
  const [totalRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.paymentStatus, "success"),
      ),
    );

  return NextResponse.json({
    usage: {
      cvBuilds: usageMap["cv_build"],
      checkerChecks: usageMap["checker_check"],
      aiRevisions: usageMap["ai_revision"],
      aiSuggestions: usageMap["ai_suggestion"],
      coverLetters: usageMap["cover_letter_generate"],
    },
    premium: {
      isPremium: access.isPremium,
      tierName: access.tierName,
      activePackages: access.activePackages,
      expiresAt: premiumExpiresAt,
      daysRemaining: premiumExpiresAt
        ? Math.max(0, Math.floor((premiumExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
    },
    limits: access.limits,
    payments: {
      totalSpent: Number(totalRow.total),
      history: paymentHistory,
    },
  });
});
