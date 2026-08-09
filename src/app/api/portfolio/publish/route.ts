import { NextRequest, NextResponse } from "next/server";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { THEMES } from "@/components/portfolio/themes";
import { isValidSlug } from "@/lib/portfolio-safety";

/* ─── GET /api/portfolio/publish — status publish user ─── */
export const GET = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const [row] = await db
    .select({ slug: portfolioPages.slug, theme: portfolioPages.theme, publishedAt: portfolioPages.publishedAt, updatedAt: portfolioPages.updatedAt })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ published: false });
  }

  return NextResponse.json({
    published: true,
    slug: row.slug,
    theme: row.theme,
    url: `${getBaseUrl()}/p/${row.slug}`,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  });
});

/* ─── POST /api/portfolio/publish — publish / update ─── */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  let body: { slug?: string; theme?: string; data?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_BODY", "Body JSON tidak valid", 400);
  }

  const slug = (body.slug || "").trim().toLowerCase();
  if (!isValidSlug(slug)) {
    return errorResponse(
      "INVALID_SLUG",
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung (3–50 karakter), tanpa kata terlarang.",
      400,
    );
  }

  const theme = body.theme || "glass";
  if (!THEMES[theme]) {
    return errorResponse("INVALID_THEME", "Tema tidak dikenal", 400);
  }

  const data = body.data;
  if (!data || typeof data !== "object" || !data.formData) {
    return errorResponse("INVALID_DATA", "Data portfolio tidak lengkap (butuh formData)", 400);
  }

  const now = new Date();

  // Cek slug dipakai user lain?
  const [existing] = await db
    .select({ id: portfolioPages.id, userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(or(eq(portfolioPages.slug, slug), eq(portfolioPages.userId, auth.userId)))
    .limit(1);

  if (existing) {
    if (existing.userId !== auth.userId) {
      return errorResponse("SLUG_TAKEN", "Slug sudah dipakai pengguna lain. Pilih slug lain.", 409);
    }
    // Update punya user ini
    try {
      await db
        .update(portfolioPages)
        .set({ slug, theme, data, updatedAt: now })
        .where(eq(portfolioPages.id, existing.id));
    } catch (err) {
      return uniqueViolation(err);
    }
  } else {
    try {
      await db.insert(portfolioPages).values({
        userId: auth.userId,
        slug,
        theme,
        data,
        publishedAt: now,
        updatedAt: now,
      });
    } catch (err) {
      return uniqueViolation(err);
    }
  }

  return NextResponse.json({
    published: true,
    slug,
    theme,
    url: `${getBaseUrl(request)}/p/${slug}`,
    publishedAt: now,
  });
});

/* ─── DELETE /api/portfolio/publish — unpublish ─── */
export const DELETE = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db.delete(portfolioPages).where(eq(portfolioPages.userId, auth.userId));

  return NextResponse.json({ published: false });
});

/** Unique violation Postgres (23505) → 409 SLUG_TAKEN, bukan 500. */
function uniqueViolation(err: unknown): NextResponse {
  const code = (err as { code?: string })?.code;
  if (code === "23505") {
    return errorResponse("SLUG_TAKEN", "Slug sudah dipakai pengguna lain. Pilih slug lain.", 409);
  }
  throw err;
}

function getBaseUrl(req?: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // Vercel preview/production
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Fallback: origin dari request
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${req.nextUrl.protocol}//${host}`;
  }
  return "http://localhost:3000";
}
