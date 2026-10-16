import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withAdmin, apiHandler, errorResponse, noCache } from "@/lib/api-utils";
import { db } from "@/db";
import { careerHubPosts } from "@/db/schema";
import { careerHubPostUpdateSchema, slugifyCareerHubTitle } from "@/lib/career-hub-schemas";

type Params = { params: Promise<{ id: string }> };

export const PATCH = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = careerHubPostUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Data artikel tidak valid.", 400);
  }
  const [existing] = await db.select().from(careerHubPosts).where(eq(careerHubPosts.id, id)).limit(1);
  if (!existing) return errorResponse("NOT_FOUND", "Artikel tidak ditemukan.", 404);
  const data = parsed.data;
  const updates: Partial<typeof careerHubPosts.$inferInsert> = { updatedAt: new Date() };
  for (const key of ["title", "excerpt", "content", "category", "tags"] as const) {
    if (data[key] !== undefined) updates[key] = data[key] as never;
  }
  if (data.slug !== undefined) updates.slug = data.slug;
  else if (data.title !== undefined && existing.slug === slugifyCareerHubTitle(existing.title)) {
    updates.slug = slugifyCareerHubTitle(data.title);
  }
  if (data.coverImageUrl !== undefined) updates.coverImageUrl = data.coverImageUrl;
  if (data.status !== undefined && data.status !== existing.status) {
    // Terbitkan hanya kalau isinya benar-benar ada. Dulu status bisa diubah
    // dari daftar admin tanpa cek isi, sehingga artikel dengan ringkasan atau
    // body kosong ikut tayang ke pembaca.
    if (data.status === "published") {
      const nextExcerpt = data.excerpt ?? existing.excerpt;
      const nextContent = data.content ?? existing.content;
      if (!nextExcerpt.trim() || !nextContent.trim()) {
        return errorResponse(
          "INVALID_INPUT",
          "Isi dan ringkasan harus diisi sebelum artikel diterbitkan.",
          400,
        );
      }
    }
    updates.status = data.status;
    updates.publishedAt = data.status === "published" ? new Date() : null;
  }
  try {
    const [post] = await db.update(careerHubPosts).set(updates)
      .where(eq(careerHubPosts.id, id)).returning();
    return NextResponse.json({ post }, { headers: noCache() });
  } catch (error) {
    if (isUniqueViolation(error)) return errorResponse("DUPLICATE_SLUG", "Slug sudah dipakai artikel lain.", 409);
    throw error;
  }
});

export const DELETE = apiHandler(async (_request: NextRequest, { params }: Params) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const [removed] = await db.delete(careerHubPosts).where(eq(careerHubPosts.id, id)).returning({ id: careerHubPosts.id });
  if (!removed) return errorResponse("NOT_FOUND", "Artikel tidak ditemukan.", 404);
  return NextResponse.json({ removed: true }, { headers: noCache() });
});

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
