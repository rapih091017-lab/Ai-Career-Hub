import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { trackedJobs } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { ensureStages } from "@/lib/tracker.server";
import { POSITION_GAP } from "@/lib/tracker";
import { cleanText, jobBodySchema, parseDateOrNull } from "@/lib/tracker-schemas";

/** GET /api/tracker/jobs: semua lowongan milik user, terurut per posisi. */
export const GET = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const jobs = await db
    .select()
    .from(trackedJobs)
    .where(eq(trackedJobs.userId, auth.userId))
    .orderBy(asc(trackedJobs.position), asc(trackedJobs.createdAt));

  return NextResponse.json({ jobs }, { status: 200 });
});

/** POST /api/tracker/jobs: simpan lowongan baru. Tanpa stageId, masuk ke
 * tahap pertama; kartu diletakkan di akhir kolomnya. */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = await request.json().catch(() => null);
  const parsed = jobBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const stages = await ensureStages(userId);
  const stageId = parsed.data.stageId ?? stages[0].id;
  if (!stages.some((stage) => stage.id === stageId)) {
    return errorResponse("NOT_FOUND", "Tahap tidak ditemukan", 404);
  }

  const [maxPos] = await db
    .select({ value: sql<number>`coalesce(max(${trackedJobs.position}), 0)` })
    .from(trackedJobs)
    .where(and(eq(trackedJobs.userId, userId), eq(trackedJobs.stageId, stageId)));

  const d = parsed.data;
  const [job] = await db
    .insert(trackedJobs)
    .values({
      userId,
      stageId,
      title: d.title,
      company: cleanText(d.company),
      location: cleanText(d.location),
      url: cleanText(d.url),
      description: cleanText(d.description),
      salaryNote: cleanText(d.salaryNote),
      notes: cleanText(d.notes),
      contactName: cleanText(d.contactName),
      contactInfo: cleanText(d.contactInfo),
      appliedAt: parseDateOrNull(d.appliedAt),
      cvId: d.cvId ?? null,
      coverLetterId: d.coverLetterId ?? null,
      position: Number(maxPos.value) + POSITION_GAP,
    })
    .returning();

  return NextResponse.json({ job }, { status: 201 });
});