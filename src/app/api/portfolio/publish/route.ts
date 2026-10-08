import { NextRequest, NextResponse } from "next/server";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioPages, portfolioTrialUses } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { THEMES } from "@/components/portfolio/themes";
import { isValidSlug } from "@/lib/portfolio-safety";
import { getUserAccess } from "@/lib/access";

const UPGRADE_URL = "/settings/billing?plan=portfolio-web";

/** Hasil entitlement portfolio user (tanpa melihat apakah sudah ada halaman live). */
async function portfolioEntitlement(userId: string): Promise<{
  entitled: boolean;
  trialUsed: boolean;
  trialAvailable: boolean;
}> {
  const access = await getUserAccess(userId);
  const lim = access.limits.portfolio_web;
  const entitled =
    lim === "unlimited" || (typeof lim === "number" && lim > 0);

  if (entitled) return { entitled: true, trialUsed: false, trialAvailable: false };

  const [trial] = await db
    .select({ id: portfolioTrialUses.id })
    .from(portfolioTrialUses)
    .where(eq(portfolioTrialUses.userId, userId))
    .limit(1);

  const trialUsed = !!trial;
  return { entitled: false, trialUsed, trialAvailable: !trialUsed };
}

function upgradeBody() {
  return errorResponse(
    "PORTFOLIO_PACKAGE_REQUIRED",
    "Publish gratis hanya berlaku 1x percobaan. Aktifkan paket Portfolio Web untuk terus live atau memperbarui konten.",
    403,
    { upgradeUrl: UPGRADE_URL },
  );
}

/* ─── GET /api/portfolio/publish, status publish + entitlement user ─── */
export const GET = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const ent = await portfolioEntitlement(auth.userId);

  const [row] = await db
    .select({ slug: portfolioPages.slug, theme: portfolioPages.theme, publishedAt: portfolioPages.publishedAt, updatedAt: portfolioPages.updatedAt })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  // Trial dianggap terpakai jika pernah publish (mencakup user lama yang
  // publish saat fitur masih gratis penuh).
  const effectiveTrialUsed = !ent.entitled && (ent.trialUsed || !!row);

  const plan = {
    entitled: ent.entitled,
    trialUsed: effectiveTrialUsed,
    trialAvailable: !ent.entitled && !effectiveTrialUsed,
    upgradeUrl: UPGRADE_URL,
  };

  if (!row) {
    return NextResponse.json({ published: false, plan });
  }

  return NextResponse.json({
    published: true,
    slug: row.slug,
    theme: row.theme,
    url: `${getBaseUrl()}/p/${row.slug}`,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    plan,
  });
});

/* ─── POST /api/portfolio/publish, publish / update ─── */
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

  // ── Gating: 1x trial gratis, publish/update berikutnya butuh paket ──
  const ent = await portfolioEntitlement(auth.userId);

  const [existing] = await db
    .select({ id: portfolioPages.id, userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(or(eq(portfolioPages.slug, slug), eq(portfolioPages.userId, auth.userId)))
    .limit(1);

  const isUpdate = !!existing && existing.userId === auth.userId;
  // Trial dianggap terpakai kalau user sudah pernah punya halaman live
  // (termasuk user lama era gratis) atau sudah memakai trial sebelumnya.
  const effectiveTrialUsed =
    ent.trialUsed || (!ent.entitled && isUpdate);

  if (!ent.entitled && effectiveTrialUsed) {
    return upgradeBody();
  }

  const now = new Date();

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

    // Catat pemakaian trial (hanya untuk user non-berbayar yang publish pertama kali)
    if (!ent.entitled) {
      try {
        await db
          .insert(portfolioTrialUses)
          .values({ userId: auth.userId })
          .onConflictDoNothing();
      } catch (trialErr) {
        console.error("[portfolio-publish] gagal mencatat trial:", trialErr);
      }
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

/* ─── DELETE /api/portfolio/publish, unpublish (selalu boleh) ─── */
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
