import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { jobStages, trackedJobs } from "@/db/schema";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { isStageColor, POSITION_GAP, TRACKER_LIMITS } from "@/lib/tracker";

type Params = { params: Promise<{ id: string }> };

const updateStageSchema = z.object({
  name: z.string().trim().min(1, "Nama tahap wajib diisi").max(TRACKER_LIMITS.stageName).optional(),
  color: z.string().refine(isStageColor, "Warna tidak dikenal").optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/** PATCH /api/tracker/stages/[id]: rename, ganti warna, atau ubah urutan. */
export const PATCH = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateStageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const updates: { name?: string; color?: string; sortOrder?: number } = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;
  if (parsed.data.sortOrder !== undefined) updates.sortOrder = parsed.data.sortOrder;
  if (Object.keys(updates).length === 0) {
    return errorResponse("INVALID_INPUT", "Tidak ada perubahan yang dikirim", 400);
  }

  const [updated] = await db
    .update(jobStages)
    .set(updates)
    .where(and(eq(jobStages.id, id), eq(jobStages.userId, auth.userId)))
    .returning();

  if (!updated) {
    return errorResponse("NOT_FOUND", "Tahap tidak ditemukan", 404);
  }

  return NextResponse.json({ stage: updated }, { status: 200 });
});

/** DELETE /api/tracker/stages/[id]: hapus tahap. Kalau masih berisi
 * lowongan, pindahkan dulu ke tahap tujuan (body: { moveTo }); tanpa moveTo
 * balas 409 supaya UI meminta pilihan dulu. Tahap terakhir tidak bisa dihapus. */
export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  const { id } = await params;

  const [stage] = await db
    .select({ id: jobStages.id })
    .from(jobStages)
    .where(and(eq(jobStages.id, id), eq(jobStages.userId, userId)))
    .limit(1);
  if (!stage) {
    return errorResponse("NOT_FOUND", "Tahap tidak ditemukan", 404);
  }

  const [stageCount] = await db
    .select({ value: count() })
    .from(jobStages)
    .where(eq(jobStages.userId, userId));
  if (Number(stageCount.value) <= 1) {
    return errorResponse("LAST_STAGE", "Minimal satu tahap harus tersisa.", 400);
  }

  const [jobCount] = await db
    .select({ value: count() })
    .from(trackedJobs)
    .where(eq(trackedJobs.stageId, id));
  const jobTotal = Number(jobCount.value);

  if (jobTotal === 0) {
    await db.delete(jobStages).where(eq(jobStages.id, id));
    return NextResponse.json({ success: true, moved: 0 }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  const moveTo = body && typeof body.moveTo === "string" ? body.moveTo : null;
  if (!moveTo) {
    return errorResponse(
      "STAGE_NOT_EMPTY",
      "Tahap masih berisi lowongan. Pilih tahap tujuan untuk memindahkannya.",
      409,
      { jobCount: jobTotal },
    );
  }
  if (moveTo === id) {
    return errorResponse("INVALID_INPUT", "Tahap tujuan tidak boleh sama dengan tahap yang dihapus", 400);
  }

  const [target] = await db
    .select({ id: jobStages.id })
    .from(jobStages)
    .where(and(eq(jobStages.id, moveTo), eq(jobStages.userId, userId)))
    .limit(1);
  if (!target) {
    return errorResponse("NOT_FOUND", "Tahap tujuan tidak ditemukan", 404);
  }

  await db.transaction(async (tx) => {
    const moving = await tx
      .select({ id: trackedJobs.id })
      .from(trackedJobs)
      .where(eq(trackedJobs.stageId, id))
      .orderBy(asc(trackedJobs.position));

    const [maxPos] = await tx
      .select({ value: sql<number>`coalesce(max(${trackedJobs.position}), 0)` })
      .from(trackedJobs)
      .where(eq(trackedJobs.stageId, moveTo));

    let pos = Number(maxPos.value);
    for (const job of moving) {
      pos += POSITION_GAP;
      await tx
        .update(trackedJobs)
        .set({ stageId: moveTo, position: pos, updatedAt: new Date() })
        .where(eq(trackedJobs.id, job.id));
    }

    await tx.delete(jobStages).where(eq(jobStages.id, id));
  });

  return NextResponse.json({ success: true, moved: jobTotal }, { status: 200 });
});