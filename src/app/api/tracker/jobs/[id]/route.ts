import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { jobStages, trackedJobs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { POSITION_GAP } from "@/lib/tracker";
import { cleanText, parseDateOrNull, updateJobSchema } from "@/lib/tracker-schemas";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/tracker/jobs/[id]: update field, pindah tahap, atau reorder. */
export const PATCH = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const [existing] = await db
    .select()
    .from(trackedJobs)
    .where(and(eq(trackedJobs.id, id), eq(trackedJobs.userId, userId)))
    .limit(1);
  if (!existing) {
    return errorResponse("NOT_FOUND", "Lowongan tidak ditemukan", 404);
  }

  const d = parsed.data;
  const updates: Partial<typeof trackedJobs.$inferInsert> = { updatedAt: new Date() };

  if (d.title !== undefined) updates.title = d.title;
  if (d.company !== undefined) updates.company = cleanText(d.company);
  if (d.location !== undefined) updates.location = cleanText(d.location);
  if (d.url !== undefined) updates.url = cleanText(d.url);
  if (d.description !== undefined) updates.description = cleanText(d.description);
  if (d.salaryNote !== undefined) updates.salaryNote = cleanText(d.salaryNote);
  if (d.notes !== undefined) updates.notes = cleanText(d.notes);
  if (d.contactName !== undefined) updates.contactName = cleanText(d.contactName);
  if (d.contactInfo !== undefined) updates.contactInfo = cleanText(d.contactInfo);
  if (d.appliedAt !== undefined) updates.appliedAt = parseDateOrNull(d.appliedAt);
  if (d.cvId !== undefined) updates.cvId = d.cvId;
  if (d.coverLetterId !== undefined) updates.coverLetterId = d.coverLetterId;

  if (d.stageId !== undefined && d.stageId !== existing.stageId) {
    const [stage] = await db
      .select({ id: jobStages.id })
      .from(jobStages)
      .where(and(eq(jobStages.id, d.stageId), eq(jobStages.userId, userId)))
      .limit(1);
    if (!stage) {
      return errorResponse("NOT_FOUND", "Tahap tidak ditemukan", 404);
    }
    updates.stageId = d.stageId;

    // Pindah kolom tanpa posisi eksplisit: taruh di akhir kolom tujuan.
    if (d.position === undefined) {
      const [maxPos] = await db
        .select({ value: sql<number>`coalesce(max(${trackedJobs.position}), 0)` })
        .from(trackedJobs)
        .where(and(eq(trackedJobs.userId, userId), eq(trackedJobs.stageId, d.stageId)));
      updates.position = Number(maxPos.value) + POSITION_GAP;
    }
  }

  if (d.position !== undefined) updates.position = d.position;

  const [updated] = await db
    .update(trackedJobs)
    .set(updates)
    .where(and(eq(trackedJobs.id, id), eq(trackedJobs.userId, userId)))
    .returning();

  return NextResponse.json({ job: updated }, { status: 200 });
});

/** DELETE /api/tracker/jobs/[id] */
export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const [deleted] = await db
    .delete(trackedJobs)
    .where(and(eq(trackedJobs.id, id), eq(trackedJobs.userId, auth.userId)))
    .returning({ id: trackedJobs.id });

  if (!deleted) {
    return errorResponse("NOT_FOUND", "Lowongan tidak ditemukan", 404);
  }

  return NextResponse.json({ success: true }, { status: 200 });
});