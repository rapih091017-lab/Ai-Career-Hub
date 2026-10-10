import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin, apiHandler, errorResponse, noCache } from "@/lib/api-utils";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { testimonialUpdateSchema } from "@/lib/testimonial-schemas";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/testimonials/[id]: ubah testimoni (admin). */
export const PATCH = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = testimonialUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);
  }
  const data = parsed.data;
  const updates: Partial<typeof testimonials.$inferInsert> = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.role !== undefined) updates.role = data.role;
  if (data.text !== undefined) updates.text = data.text;
  if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
  if (data.isPublished !== undefined) updates.isPublished = data.isPublished;
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

  const [updated] = await db.update(testimonials).set(updates).where(eq(testimonials.id, id)).returning();
  if (!updated) return errorResponse("NOT_FOUND", "Testimoni tidak ditemukan.", 404);
  return NextResponse.json({ testimonial: updated }, { headers: noCache() });
});

/** DELETE /api/testimonials/[id]: hapus testimoni (admin). */
export const DELETE = apiHandler(async (_request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const removed = await db.delete(testimonials).where(eq(testimonials.id, id)).returning({ id: testimonials.id });
  if (removed.length === 0) return errorResponse("NOT_FOUND", "Testimoni tidak ditemukan.", 404);
  return NextResponse.json({ removed: true }, { headers: noCache() });
});
