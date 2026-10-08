import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { careerPaths } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { careerPathBodySchema, slugifyRole } from "@/lib/career-path-schemas";

/** GET /api/admin/career-paths: semua jalur karier (termasuk draf). */
export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const rows = await db
    .select()
    .from(careerPaths)
    .orderBy(asc(careerPaths.sortOrder), desc(careerPaths.createdAt));

  return NextResponse.json({ careerPaths: rows });
});

/** POST /api/admin/career-paths: tambah posisi baru. */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = careerPathBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const data = parsed.data;
  const slug = data.slug && data.slug.length > 0 ? data.slug : slugifyRole(data.role);
  if (!slug) {
    return errorResponse("INVALID_INPUT", "Slug tidak bisa dibuat dari nama posisi ini.", 400);
  }

  const existing = await db
    .select({ id: careerPaths.id })
    .from(careerPaths)
    .where(eq(careerPaths.slug, slug))
    .limit(1);
  if (existing.length > 0) {
    return errorResponse("DUPLICATE_SLUG", "Posisi dengan slug ini sudah ada. Ubah nama posisi atau slug.", 400);
  }

  const [maxOrder] = await db
    .select({ value: sql<number>`coalesce(max(${careerPaths.sortOrder}), -1)` })
    .from(careerPaths);

  const [created] = await db
    .insert(careerPaths)
    .values({
      slug,
      role: data.role,
      category: data.category,
      summary: data.summary ?? null,
      levels: data.levels,
      skills: data.skills,
      steps: data.steps,
      isPublished: data.isPublished ?? true,
      sortOrder: data.sortOrder ?? Number(maxOrder.value) + 1,
    })
    .returning();

  return NextResponse.json({ careerPath: created }, { status: 201 });
});
