import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { checkerResults } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select({
      id: checkerResults.id,
      scores: checkerResults.scores,
      aiFeedback: checkerResults.aiFeedback,
      createdAt: checkerResults.createdAt,
      jobDescription: checkerResults.jobDescription,
    })
    .from(checkerResults)
    .where(eq(checkerResults.userId, session.user.id))
    .orderBy(desc(checkerResults.createdAt))
    .limit(20);

  return NextResponse.json(results);
}
