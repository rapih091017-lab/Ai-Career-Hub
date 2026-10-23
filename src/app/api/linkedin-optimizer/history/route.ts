import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { linkedinOptimizations } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: linkedinOptimizations.id,
      branding: linkedinOptimizations.branding,
      overallScore: linkedinOptimizations.overallScore,
      grade: linkedinOptimizations.grade,
      createdAt: linkedinOptimizations.createdAt,
      // Hanya potongan verdict yang dibutuhkan baris riwayat; full_result
      // terlalu besar untuk dikirim 20 kali.
      verdict: sql<string | null>`${linkedinOptimizations.fullResult}->>'verdict'`,
    })
    .from(linkedinOptimizations)
    .where(eq(linkedinOptimizations.userId, session.user.id))
    .orderBy(desc(linkedinOptimizations.createdAt))
    .limit(20);

  return NextResponse.json(rows);
}
