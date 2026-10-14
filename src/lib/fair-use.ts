export { PRO_CHECK_FAIR_USE, type ProCheckTier } from "@/lib/package-catalog-static";

import { PRO_CHECK_FAIR_USE, type ProCheckTier } from "@/lib/package-catalog-static";
import { db } from "@/db";
import { usageLogs } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getUserAccess } from "@/lib/access";

/**
 * Batas wajar pemakaian model mendalam untuk Cek CV.
 *
 * Longgar jauh di atas pemakaian normal. Yang lewat batas tidak diblokir:
 * analisis tetap jalan dengan model ringan, supaya klaim "tanpa batas" di
 * kartu harga tidak berubah menjadi pemblokiran.
 */
function firstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Paket apa yang sedang dimiliki pengguna, untuk menentukan batasnya. */
export async function resolveCheckTier(userId: string): Promise<ProCheckTier> {
  const access = await getUserAccess(userId);
  if (!access.purchasedFeatures.cv_analyzer) return "free";
  // Paket dengan kuota checker tetap memakai kuota Kuotanya, bukan fair-use.
  if (typeof access.limits.cv_analyzer === "number" && access.limits.cv_analyzer <= 5) {
    return "lite";
  }
  const hasMax = access.activePackages.includes("max_bulanan");
  if (hasMax) return "max";
  return "pro";
}

export interface ProCheckAllowance {
  /** Boleh memakai model mendalam bulan ini. */
  allowed: boolean;
  /** Sudah terpakai bulan ini. */
  used: number;
  /** Batas bulan ini. */
  limit: number;
}

/**
 * Cek apakah pemakaian model mendalam masih di bawah batas wajar.
 * Pemakaian dihitung dari `usage_logs` bulan berjalan, jadi sesuai dengan
 * langganan yang sedang aktif.
 */
export async function checkProCheckAllowance(userId: string): Promise<ProCheckAllowance> {
  const tier = await resolveCheckTier(userId);
  const limit = PRO_CHECK_FAIR_USE[tier];

  if (limit <= 0) {
    return { allowed: false, used: 0, limit: 0 };
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        eq(usageLogs.actionType, "checker_check_pro"),
        gte(usageLogs.createdAt, firstOfMonth()),
      ),
    );

  const used = Number(row?.count ?? 0);
  return { allowed: used < limit, used, limit };
}