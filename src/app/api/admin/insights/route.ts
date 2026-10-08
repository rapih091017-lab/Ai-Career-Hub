import { NextResponse } from "next/server";
import { withAdmin, apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { checkerResults, coverLetters, cvDocuments, payments, trackedJobs, usageLogs, users } from "@/db/schema";
import { count, countDistinct, desc, eq, gte, sql } from "drizzle-orm";

/** GET /api/admin/insights: aktivitas fitur, tren registrasi, dan funnel user. */
export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);

  const featureUsage = await db
    .select({ action: usageLogs.actionType, total: count() })
    .from(usageLogs)
    .where(gte(usageLogs.createdAt, thirtyDaysAgo))
    .groupBy(usageLogs.actionType)
    .orderBy(desc(count()))
    .limit(15);

  const registrations = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${users.createdAt}), 'YYYY-MM-DD')`,
      total: count(),
    })
    .from(users)
    .where(gte(users.createdAt, eightWeeksAgo))
    .groupBy(sql`date_trunc('week', ${users.createdAt})`)
    .orderBy(sql`date_trunc('week', ${users.createdAt})`);

  const [totalUsers] = await db.select({ value: count() }).from(users);
  const [usersWithCv] = await db.select({ value: countDistinct(cvDocuments.userId) }).from(cvDocuments);
  const [usersWithTracker] = await db.select({ value: countDistinct(trackedJobs.userId) }).from(trackedJobs);
  const [usersPaid] = await db
    .select({ value: countDistinct(payments.userId) })
    .from(payments)
    .where(eq(payments.paymentStatus, "success"));

  const [cvTotal] = await db.select({ value: count() }).from(cvDocuments);
  const [checkerTotal] = await db.select({ value: count() }).from(checkerResults);
  const [lettersTotal] = await db.select({ value: count() }).from(coverLetters);

  return NextResponse.json({
    funnel: {
      totalUsers: Number(totalUsers.value),
      usersWithCv: Number(usersWithCv.value),
      usersWithTracker: Number(usersWithTracker.value),
      usersPaid: Number(usersPaid.value),
    },
    totals: {
      cvs: Number(cvTotal.value),
      checkerRuns: Number(checkerTotal.value),
      coverLetters: Number(lettersTotal.value),
    },
    featureUsage: featureUsage.map((row) => ({ action: row.action, total: Number(row.total) })),
    registrations: registrations.map((row) => ({ week: row.week, total: Number(row.total) })),
  });
});
