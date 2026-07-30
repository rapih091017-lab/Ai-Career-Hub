import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { checkerResults } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await db
    .select({
      id: checkerResults.id,
      scores: checkerResults.scores,
      aiFeedback: checkerResults.aiFeedback,
      fullResult: checkerResults.fullResult,
      cvTextExtracted: checkerResults.cvTextExtracted,
      jobDescription: checkerResults.jobDescription,
      createdAt: checkerResults.createdAt,
    })
    .from(checkerResults)
    .where(
      and(
        eq(checkerResults.id, id),
        eq(checkerResults.userId, session.user.id),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
