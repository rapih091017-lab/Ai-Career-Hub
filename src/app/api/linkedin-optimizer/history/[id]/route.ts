import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { linkedinOptimizations } from "@/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();

  const [row] = await db
    .select({
      id: linkedinOptimizations.id,
      userId: linkedinOptimizations.userId,
      anonymousFingerprint: linkedinOptimizations.anonymousFingerprint,
      branding: linkedinOptimizations.branding,
      overallScore: linkedinOptimizations.overallScore,
      grade: linkedinOptimizations.grade,
      fullResult: linkedinOptimizations.fullResult,
      createdAt: linkedinOptimizations.createdAt,
    })
    .from(linkedinOptimizations)
    .where(eq(linkedinOptimizations.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.userId) {
    if (row.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    // Hasil tamu hanya boleh dibuka browser yang membuatnya. anonId dikirim
    // lewat header oleh halaman hasil; tanpa itu, jangan tebak dari IP.
    const anonId = request.headers.get("x-anon-id")?.trim() || "";
    if (!anonId || row.anonymousFingerprint?.anonId !== anonId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({
    id: row.id,
    branding: row.branding,
    overallScore: row.overallScore,
    grade: row.grade,
    fullResult: row.fullResult,
    createdAt: row.createdAt,
  });
}
