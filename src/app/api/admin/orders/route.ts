import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

/** GET /api/admin/orders: daftar pesanan dengan filter status & pencarian
 * (order id atau email). Ringkasan agregat ikut dikirim untuk kartu di UI. */
export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "all";
  const q = (searchParams.get("q") ?? "").trim();

  const filters = [];
  if (["success", "pending", "failed"].includes(status)) {
    filters.push(eq(payments.paymentStatus, status));
  }
  if (q) {
    filters.push(or(ilike(payments.orderId, `%${q}%`), ilike(users.email, `%${q}%`)));
  }

  const orders = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      packageName: payments.packageName,
      packageType: payments.packageType,
      amount: payments.amount,
      paymentStatus: payments.paymentStatus,
      paymentMethod: payments.paymentMethod,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      referralCode: payments.referralCode,
      userEmail: users.email,
      userName: users.name,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.userId))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(payments.createdAt))
    .limit(200);

  const summary = await db
    .select({
      status: payments.paymentStatus,
      total: count(),
      amount: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .groupBy(payments.paymentStatus);

  return NextResponse.json({
    orders,
    summary: summary.map((row) => ({
      status: row.status,
      total: Number(row.total),
      amount: Number(row.amount),
    })),
  });
});
