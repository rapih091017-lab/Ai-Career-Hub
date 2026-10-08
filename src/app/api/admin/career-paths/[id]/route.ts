import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { careerPaths } from "@/db/schema";
import { eq } from "drizzle-orm";
import { careerPathUpdateSchema } from "@/lib/career-path-schemas";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/career-paths/[id]: ubah jalur karier (atau publish/draf). */
export const PATCH = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = careerPathUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const [existing] = await db
    .select({ id: careerPaths.id })
    .from(careerPaths)
    .where(eq(careerPaths.id, id))
    .limit(1);
  if (!existing) {
    return errorResponse("NOT_FOUND", "Jalur karier tidak ditemukan.", 404);
  }

  const data = parsed.data;
  const updates: Partial<typeof careerPaths.$inferInsert> = { updatedAt: new Date() };
  if (data.role !== undefined) updates.role = data.role;
  if (data.category !== undefined) updates.category = data.category;
  if (data.summary !== undefined) updates.summary = data.summary ?? null;
  if (data.levels !== undefined) updates.levels = data.levels;
  if (data.skills !== undefined) updates.skills = data.skills;
  if (data.steps !== undefined) updates.steps = data.steps;
  if (data.isPublished !== undefined) updates.isPublished = data.isPublished;
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

  const [updated] = await db
    .update(careerPaths)
    .set(updates)
    .where(eq(careerPaths.id, id))
    .returning();

  return NextResponse.json({ careerPath: updated });
});

/** DELETE /api/admin/career-paths/[id]. */
export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const removed = await db
    .delete(careerPaths)
    .where(eq(careerPaths.id, id))
    .returning({ id: careerPaths.id });

  return NextResponse.json({ removed: removed.length });
});
