import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, cvDocuments, usageLogs, payments } from "@/db/schema";
import { count, gte, lte, sql, and, eq, desc } from "drizzle-orm";
import { withAdmin, apiHandler } from "@/lib/api-utils";

/* ─── CSV Helpers ─── */
function escapeCSV(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(...cells: unknown[]): string {
  return cells.map(escapeCSV).join(",") + "\n";
}

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

const PACKAGE_LABELS: Record<string, string> = {
  premium_pass_30d: "Premium Pass",
  single_cv: "Single CV",
  bundle_hemat: "Bundle Hemat",
  cv_starter: "CV Starter",
  cv_ai_generate: "CV AI Generate",
  cv_analyzer: "CV Analyzer",
  portfolio_web: "Portfolio Web",
};

/* ─── GET /api/admin/export?type=revenue|users|trends ─── */
export const GET = apiHandler(async (request: NextRequest) => {
  const admin = await withAdmin();
  if (admin instanceof NextResponse) return admin;

  const type = request.nextUrl.searchParams.get("type") || "revenue";
  const now = new Date();

  /* ── REVENUE REPORT ── */
    if (type === "revenue") {
      let csv = csvRow("Tanggal", "Order ID", "Package", "Amount", "Status", "Metode", "User ID", "Paid At");
      const rows = await db
        .select({
          orderId: payments.orderId,
          packageType: payments.packageType,
          amount: payments.amount,
          paymentStatus: payments.paymentStatus,
          paymentMethod: payments.paymentMethod,
          userId: payments.userId,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .orderBy(sql`${payments.paidAt} DESC NULLS LAST`)
        .limit(1000);

      for (const r of rows) {
        csv += csvRow(
          r.paidAt ? r.paidAt.toISOString().slice(0, 10) : (r.createdAt?.toISOString().slice(0, 10) ?? ""),
          r.orderId,
          PACKAGE_LABELS[r.packageType] || r.packageType,
          r.amount,
          r.paymentStatus,
          r.paymentMethod ?? "",
          r.userId,
          r.paidAt?.toISOString() ?? "",
        );
      }

      // Summary footer
      const totalRevenue = rows
        .filter((r) => r.paymentStatus === "settlement" || r.paymentStatus === "success")
        .reduce((sum, r) => sum + r.amount, 0);
      csv += `\nTotal Revenue (settled),${totalRevenue}\n`;
      csv += `Total Transactions,${rows.length}\n`;

      return csvResponse(csv, `revenue_${now.toISOString().slice(0, 10)}.csv`);
    }

    /* ── USERS REPORT ── */
    if (type === "users") {
      let csv = csvRow("ID", "Nama", "Email", "Status", "Tanggal Daftar");
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(1000);

      for (const r of rows) {
        csv += csvRow(
          r.id,
          r.name ?? "",
          r.email,
          r.status,
          r.createdAt?.toISOString().slice(0, 10) ?? "",
        );
      }

      // Count how many have CVs
      const [totalRow] = await db
        .select({ value: count() })
        .from(users);
      csv += `\nTotal Users,${totalRow.value}\n`;

      return csvResponse(csv, `users_${now.toISOString().slice(0, 10)}.csv`);
    }

    /* ── TRENDS REPORT (30 days) ── */
    if (type === "trends") {
      let csv = csvRow("Tanggal", "Registrasi", "CV Dibuat", "Revenue", "Cek ATS");
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const dayToChar = sql<string>`TO_CHAR(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`;
      const cvToChar = sql<string>`TO_CHAR(date_trunc('day', ${cvDocuments.createdAt}), 'YYYY-MM-DD')`;
      const payToChar = sql<string>`TO_CHAR(date_trunc('day', ${payments.paidAt}), 'YYYY-MM-DD')`;
      const ulToChar = sql<string>`TO_CHAR(date_trunc('day', ${usageLogs.createdAt}), 'YYYY-MM-DD')`;

      const [regTrends, cvTrends, revTrends, chkTrends] = await Promise.all([
        db
          .select({ date: dayToChar, value: count() })
          .from(users)
          .where(gte(users.createdAt, thirtyDaysAgo))
          .groupBy(dayToChar)
          .orderBy(dayToChar),
        db
          .select({ date: cvToChar, value: count() })
          .from(cvDocuments)
          .where(gte(cvDocuments.createdAt, thirtyDaysAgo))
          .groupBy(cvToChar)
          .orderBy(cvToChar),
        db
          .select({ date: payToChar, value: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
          .from(payments)
          .where(
            and(
              eq(payments.paymentStatus, "settlement"),
              gte(payments.paidAt, thirtyDaysAgo),
            ),
          )
          .groupBy(payToChar)
          .orderBy(payToChar),
        db
          .select({ date: ulToChar, value: count() })
          .from(usageLogs)
          .where(
            and(
              eq(usageLogs.actionType, "checker_check"),
              gte(usageLogs.createdAt, thirtyDaysAgo),
            ),
          )
          .groupBy(ulToChar)
          .orderBy(ulToChar),
      ]);

      const regMap = new Map(regTrends.map((r) => [r.date, r.value]));
      const cvMap = new Map(cvTrends.map((r) => [r.date, r.value]));
      const revMap = new Map(revTrends.map((r) => [r.date, Number(r.value)]));
      const chkMap = new Map(chkTrends.map((r) => [r.date, r.value]));

      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dateKey = d.toISOString().slice(0, 10);
        csv += csvRow(
          dateKey,
          regMap.get(dateKey) ?? 0,
          cvMap.get(dateKey) ?? 0,
          revMap.get(dateKey) ?? 0,
          chkMap.get(dateKey) ?? 0,
        );
      }

      return csvResponse(csv, `trends_${now.toISOString().slice(0, 10)}.csv`);
    }

    return NextResponse.json(
      { error: "INVALID_TYPE", message: "Tipe export tidak valid. Gunakan: revenue, users, atau trends." },
      { status: 400 },
    );
});
