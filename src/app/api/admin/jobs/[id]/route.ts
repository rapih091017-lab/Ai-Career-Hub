import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { jobPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jobPostSchema } from "@/lib/job-post-schemas";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/jobs/[id]: update field, toggle publish, atau keduanya. */
export const PATCH = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = jobPostSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid", 400);
  }

  const data = parsed.data;
  const updates: Partial<typeof jobPosts.$inferInsert> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.company !== undefined) updates.company = data.company || null;
  if (data.location !== undefined) updates.location = data.location || null;
  if (data.description !== undefined) updates.description = data.description || null;
  if (data.applyUrl !== undefined) updates.applyUrl = data.applyUrl;
  if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl || null;
  if (data.isPublished !== undefined) updates.isPublished = data.isPublished;

  const [job] = await db.update(jobPosts).set(updates).where(eq(jobPosts.id, id)).returning();
  if (!job) {
    return errorResponse("NOT_FOUND", "Loker tidak ditemukan", 404);
  }

  return NextResponse.json({ job });
});

/** DELETE /api/admin/jobs/[id]: hapus loker. */
export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const deleted = await db.delete(jobPosts).where(eq(jobPosts.id, id)).returning({ id: jobPosts.id });
  if (deleted.length === 0) {
    return errorResponse("NOT_FOUND", "Loker tidak ditemukan", 404);
  }

  return NextResponse.json({ success: true });
});