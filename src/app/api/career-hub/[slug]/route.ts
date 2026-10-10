import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { careerHubPosts } from "@/db/schema";
import { apiHandler, errorResponse, staleWhileRevalidate } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

export const GET = apiHandler(async (_request: NextRequest, { params }: Params) => {
  const { slug } = await params;
  const [post] = await db.select().from(careerHubPosts)
    .where(and(eq(careerHubPosts.slug, slug), eq(careerHubPosts.status, "published")))
    .limit(1);
  if (!post) return errorResponse("NOT_FOUND", "Artikel tidak ditemukan.", 404);
  return NextResponse.json({ post }, { headers: staleWhileRevalidate(60) });
});
