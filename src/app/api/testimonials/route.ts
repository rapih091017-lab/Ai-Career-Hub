import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { withAdmin, apiHandler, errorResponse, noCache, staleWhileRevalidate } from "@/lib/api-utils";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { testimonialCreateSchema } from "@/lib/testimonial-schemas";

/** GET /api/testimonials: testimoni terbit untuk landing (publik). */
export const GET = apiHandler(async () => {
  const rows = await db
    .select({ id: testimonials.id, name: testimonials.name, role: testimonials.role, text: testimonials.text, avatarUrl: testimonials.avatarUrl })
    .from(testimonials)
    .where(eq(testimonials.isPublished, true))
    .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt))
    .limit(24);
  return NextResponse.json({ testimonials: rows }, { headers: staleWhileRevalidate(120) });
});

/** POST /api/testimonials: tambah testimoni (admin). */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => null);
  const parsed = testimonialCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data testimoni tidak valid.", 400);
  }
  const data = parsed.data;
  const [created] = await db
    .insert(testimonials)
    .values({
      name: data.name,
      role: data.role,
      text: data.text,
      avatarUrl: data.avatarUrl ?? null,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
    })
    .returning();
  return NextResponse.json({ testimonial: created }, { status: 201, headers: noCache() });
});
