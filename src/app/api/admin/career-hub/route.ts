import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { withAdmin, apiHandler, errorResponse, noCache } from "@/lib/api-utils";
import { db } from "@/db";
import { careerHubPosts } from "@/db/schema";
import { careerHubAdminListQuerySchema, careerHubPostCreateSchema, slugifyCareerHubTitle } from "@/lib/career-hub-schemas";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = careerHubAdminListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return errorResponse("INVALID_INPUT", "Filter tidak valid.", 400);
  const { status, q } = parsed.data;
  const conditions = [];
  if (status) conditions.push(eq(careerHubPosts.status, status));
  if (q) conditions.push(ilike(careerHubPosts.title, `%${q.replace(/[\%_]/g, "\\$&")}%`));
  const rows = await db.select().from(careerHubPosts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(careerHubPosts.updatedAt));
  return NextResponse.json({ posts: rows }, { headers: noCache() });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => null);
  const parsed = careerHubPostCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data artikel tidak valid.", 400);
  }
  const data = parsed.data;
  const slug = data.slug || slugifyCareerHubTitle(data.title);
  if (!slug) return errorResponse("INVALID_INPUT", "Slug tidak dapat dibuat dari judul.", 400);
  try {
    const now = new Date();
    const [post] = await db.insert(careerHubPosts).values({
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      tags: data.tags,
      status: data.status,
      slug,
      coverImageUrl: data.coverImageUrl ?? null,
      publishedAt: data.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return NextResponse.json({ post }, { status: 201, headers: noCache() });
  } catch (error) {
    if (isUniqueViolation(error)) return errorResponse("DUPLICATE_SLUG", "Slug sudah dipakai artikel lain.", 409);
    throw error;
  }
});

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
