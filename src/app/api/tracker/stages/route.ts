import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { jobStages } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ensureStages, listStages } from "@/lib/tracker.server";
import { isStageColor, MAX_STAGES, TRACKER_LIMITS } from "@/lib/tracker";

const createStageSchema = z.object({
  name: z.string().trim().min(1, "Nama tahap wajib diisi").max(TRACKER_LIMITS.stageName),
  color: z.string().refine(isStageColor, "Warna tidak dikenal").optional(),
});

/** GET /api/tracker/stages: daftar tahap milik user; membuat default saat
 * pertama kali user membuka tracker. */
export const GET = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const stages = await ensureStages(auth.userId);
  return NextResponse.json({ stages }, { status: 200 });
});

/** POST /api/tracker/stages: tambah tahap custom. */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const body = await request.json().catch(() => null);
  const parsed = createStageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const [stageCount] = await db
    .select({ value: count() })
    .from(jobStages)
    .where(eq(jobStages.userId, userId));
  if (Number(stageCount.value) >= MAX_STAGES) {
    return errorResponse("LIMIT_REACHED", `Maksimal ${MAX_STAGES} tahap. Hapus salah satu untuk menambah baru.`, 400);
  }

  const [maxOrder] = await db
    .select({ value: sql<number>`coalesce(max(${jobStages.sortOrder}), -1)` })
    .from(jobStages)
    .where(eq(jobStages.userId, userId));

  const [stage] = await db
    .insert(jobStages)
    .values({
      userId,
      name: parsed.data.name,
      color: parsed.data.color ?? "slate",
      sortOrder: Number(maxOrder.value) + 1,
    })
    .returning();

  return NextResponse.json({ stage }, { status: 201 });
});