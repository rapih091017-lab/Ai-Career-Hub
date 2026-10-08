import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, cvDocuments, checkerResults } from "@/db/schema";
import { count, sql } from "drizzle-orm";

/* ─── GET /api/public/stats — angka real untuk landing page ─── */
export async function GET() {
  try {
    const [userCount] = await db.select({ value: count() }).from(users);
    const [cvCount] = await db.select({ value: count() }).from(cvDocuments);
    const [analysisCount] = await db.select({ value: count() }).from(checkerResults);
    const [avgRow] = await db
      .select({
        value: sql<number>`ROUND(AVG(CAST(${checkerResults.scores}->>'overall' AS NUMERIC)), 0)`,
      })
      .from(checkerResults);

    const avgAts = Number(avgRow?.value) || 0;

    return NextResponse.json(
      {
        totalCvs: cvCount?.value ?? 0,
        totalUsers: userCount?.value ?? 0,
        totalAnalyses: analysisCount?.value ?? 0,
        avgAtsScore: avgAts,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    // Jangan pernah menampilkan angka palsu: error → 0, UI akan sembunyi
    return NextResponse.json(
      { totalCvs: 0, totalUsers: 0, totalAnalyses: 0, avgAtsScore: 0 },
      {
        headers: { "Cache-Control": "public, s-maxage=60" },
      },
    );
  }
}