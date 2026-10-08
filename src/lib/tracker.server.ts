/**
 * Helper server Job Tracker. Dipisah dari src/lib/tracker.ts (yang berisi
 * konstanta client-safe) supaya import DB tidak bocor ke komponen client.
 */
import { db } from "@/db";
import { jobStages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { DEFAULT_STAGES } from "./tracker";

export async function listStages(userId: string) {
  return db
    .select()
    .from(jobStages)
    .where(eq(jobStages.userId, userId))
    .orderBy(asc(jobStages.sortOrder), asc(jobStages.createdAt));
}

/** Pastikan user punya minimal satu tahap. Default dibuat sekali saat user
 * pertama membuka tracker; panggilan berikutnya hanya membaca. */
export async function ensureStages(userId: string) {
  const existing = await listStages(userId);
  if (existing.length > 0) return existing;

  await db.insert(jobStages).values(
    DEFAULT_STAGES.map((stage, i) => ({
      userId,
      name: stage.name,
      color: stage.color,
      sortOrder: i,
      isDefault: true,
    })),
  );

  return listStages(userId);
}
