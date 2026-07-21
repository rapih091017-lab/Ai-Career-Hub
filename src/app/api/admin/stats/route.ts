import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, cvDocuments, usageLogs, payments, checkerResults } from "@/db/schema";
import { count, gte, lte, sql, and, eq } from "drizzle-orm";
import { withAdmin, apiHandler } from "@/lib/api-utils";

/* ─── Helper: past date ─── */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayEnd(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/* ─── GET /api/admin/stats ─── */
export const GET = apiHandler(async () => {
  const admin = await withAdmin();
  if (admin instanceof NextResponse) return admin;

  const startToday = todayStart();
  const endToday = todayEnd();
  const sevenDaysAgo = daysAgo(6); // 7 hari termasuk hari ini

  /* ── 1. Today's Stats ── */

    // Active users today (distinct userId from usage_logs)
    const [activeUsersRow] = await db
      .select({ value: sql<number>`COUNT(DISTINCT ${usageLogs.userId})` })
      .from(usageLogs)
      .where(
        and(
          gte(usageLogs.createdAt, startToday),
          lte(usageLogs.createdAt, endToday),
        ),
      );

    // New registrations today
    const [newUsersRow] = await db
      .select({ value: count() })
      .from(users)
      .where(
        and(
          gte(users.createdAt, startToday),
          lte(users.createdAt, endToday),
        ),
      );

    // CVs created today
    const [cvsCreatedRow] = await db
      .select({ value: count() })
      .from(cvDocuments)
      .where(
        and(
          gte(cvDocuments.createdAt, startToday),
          lte(cvDocuments.createdAt, endToday),
        ),
      );

    // Revenue today (settled payments)
    const [revenueRow] = await db
      .select({ value: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.paymentStatus, "settlement"),
          gte(payments.paidAt, startToday),
          lte(payments.paidAt, endToday),
        ),
      );

    // Checker usage today
    const [checkerRow] = await db
      .select({ value: count() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.actionType, "checker_check"),
          gte(usageLogs.createdAt, startToday),
          lte(usageLogs.createdAt, endToday),
        ),
      );

    /* ── 2. Trends — 7 days (optimized: 4 parallel GROUP BY queries) ── */
    // TO_CHAR returns string "YYYY-MM-DD" directly — no .slice() needed
    const dayToChar = sql<string>`TO_CHAR(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`;
    const cvToChar = sql<string>`TO_CHAR(date_trunc('day', ${cvDocuments.createdAt}), 'YYYY-MM-DD')`;
    const payToChar = sql<string>`TO_CHAR(date_trunc('day', ${payments.paidAt}), 'YYYY-MM-DD')`;
    const ulToChar = sql<string>`TO_CHAR(date_trunc('day', ${usageLogs.createdAt}), 'YYYY-MM-DD')`;

    const [regTrends, cvTrends, revTrends, chkTrends] = await Promise.all([
      db
        .select({ date: dayToChar, value: count() })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo))
        .groupBy(dayToChar)
        .orderBy(dayToChar),
      db
        .select({ date: cvToChar, value: count() })
        .from(cvDocuments)
        .where(gte(cvDocuments.createdAt, sevenDaysAgo))
        .groupBy(cvToChar)
        .orderBy(cvToChar),
      db
        .select({ date: payToChar, value: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
        .from(payments)
        .where(and(eq(payments.paymentStatus, "settlement"), gte(payments.paidAt, sevenDaysAgo)))
        .groupBy(payToChar)
        .orderBy(payToChar),
      db
        .select({ date: ulToChar, value: count() })
        .from(usageLogs)
        .where(and(eq(usageLogs.actionType, "checker_check"), gte(usageLogs.createdAt, sevenDaysAgo)))
        .groupBy(ulToChar)
        .orderBy(ulToChar),
    ]);

    // Build lookup maps — dates are already "YYYY-MM-DD" strings from TO_CHAR
    const regMap = new Map(regTrends.map((r) => [r.date, r.value]));
    const cvMap = new Map(cvTrends.map((r) => [r.date, r.value]));
    const revMap = new Map(revTrends.map((r) => [r.date, Number(r.value)]));
    const chkMap = new Map(chkTrends.map((r) => [r.date, r.value]));

    const trends = Array.from({ length: 7 }, (_, i) => {
      const d = daysAgo(6 - i);
      const dateKey = d.toISOString().slice(0, 10);
      return {
        date: dateKey,
        registrations: regMap.get(dateKey) ?? 0,
        cvsCreated: cvMap.get(dateKey) ?? 0,
        revenue: revMap.get(dateKey) ?? 0,
        checkerUsage: chkMap.get(dateKey) ?? 0,
      };
    });

    /* ── 3. Package Sales ── */
    const packageSales = await db
      .select({
        packageType: payments.packageType,
        sales: count(),
        revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(eq(payments.paymentStatus, "settlement"))
      .groupBy(payments.packageType)
      .orderBy(sql`sales DESC`);

    /* ── 4. Recent Users ── */
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(10);

    /* ── 5. Recent Transactions ── */
    const recentTransactions = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        packageType: payments.packageType,
        amount: payments.amount,
        paymentStatus: payments.paymentStatus,
        paymentMethod: payments.paymentMethod,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .orderBy(sql`${payments.createdAt} DESC`)
      .limit(10);

    /* ── 6. Total stats ── */
    const [totalUsersRow] = await db
      .select({ value: count() })
      .from(users);
    const [totalCvsRow] = await db
      .select({ value: count() })
      .from(cvDocuments);
    const [totalRevenueRow] = await db
      .select({ value: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.paymentStatus, "settlement"));
    const [totalCheckRow] = await db
      .select({ value: count() })
      .from(checkerResults);

    /* ── Response ── */
    return NextResponse.json({
      today: {
        activeUsers: activeUsersRow?.value ?? 0,
        newRegistrations: newUsersRow?.value ?? 0,
        cvsCreated: cvsCreatedRow?.value ?? 0,
        revenue: Number(revenueRow?.value ?? 0),
        checkerUsage: checkerRow?.value ?? 0,
      },
      trends,
      packageSales,
      recentUsers,
      recentTransactions,
      totals: {
        users: totalUsersRow?.value ?? 0,
        cvs: totalCvsRow?.value ?? 0,
        revenue: Number(totalRevenueRow?.value ?? 0),
        checkerChecks: totalCheckRow?.value ?? 0,
      },
    });
});
