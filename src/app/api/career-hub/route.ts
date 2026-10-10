import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { careerHubPosts } from "@/db/schema";
import { careerHubListQuerySchema } from "@/lib/career-hub-schemas";
import { apiHandler, errorResponse, staleWhileRevalidate } from "@/lib/api-utils";

export const GET = apiHandler(async (request: NextRequest) => {
  const parsed = careerHubListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Filter tidak valid.", 400);
  }
  const { q, category, tag, page, pageSize } = parsed.data;
  const filters = [eq(careerHubPosts.status, "published")];
  if (category) filters.push(eq(careerHubPosts.category, category));
  if (q) filters.push(or(
    ilike(careerHubPosts.title, `%${q.replace(/[\%_]/g, "\\$&")}%`),
    ilike(careerHubPosts.excerpt, `%${q.replace(/[\%_]/g, "\\$&")}%`),
    ilike(careerHubPosts.content, `%${q.replace(/[\%_]/g, "\\$&")}%`),
  )!);
  if (tag) filters.push(sql`${careerHubPosts.tags} @> ${JSON.stringify([tag])}::jsonb`);
  const where = and(...filters);

  const [posts, [{ total }], tagRows] = await Promise.all([
    db.select({
      id: careerHubPosts.id,
      slug: careerHubPosts.slug,
      title: careerHubPosts.title,
      excerpt: careerHubPosts.excerpt,
      coverImageUrl: careerHubPosts.coverImageUrl,
      category: careerHubPosts.category,
      tags: careerHubPosts.tags,
      publishedAt: careerHubPosts.publishedAt,
    }).from(careerHubPosts).where(where)
      .orderBy(desc(careerHubPosts.publishedAt), desc(careerHubPosts.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(careerHubPosts).where(where),
    db.select({ tags: careerHubPosts.tags }).from(careerHubPosts).where(eq(careerHubPosts.status, "published")),
  ]);
  const tags = [...new Set(tagRows.flatMap((row) => row.tags))].sort((a, b) => a.localeCompare(b));
  return NextResponse.json({
    posts,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    filters: { tags },
  }, { headers: staleWhileRevalidate(60) });
});
