import { NextRequest, NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioPages } from "@/db/schema";
import { getUserAccess, maxActivePortfoliosFor } from "@/lib/access";
import { publishPayloadSchema, emptySectionIds } from "@/lib/portfolio/schema";
import { canPublish, quotaMessage, UPGRADE_URL } from "@/lib/portfolio/publish-gate";

export const dynamic = "force-dynamic";

async function activeCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(portfolioPages)
    .where(
      and(eq(portfolioPages.userId, userId), eq(portfolioPages.status, "published")),
    );
  return Number(row?.n ?? 0);
}

async function baseUrl(req?: NextRequest): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${req.nextUrl.protocol}//${host}`;
  }
  return "http://localhost:3000";
}

function suggestSlugs(first: string, last: string, taken: string): string[] {
  const base = `${first}-${last}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const out: string[] = [];
  let n = 1;
  while (out.length < 3 && n < 100) {
    const cand = n === 1 ? base : `${base}-${n}`;
    if (cand !== taken) out.push(cand);
    n += 1;
  }
  return out;
}

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const access = await getUserAccess(auth.userId);
  const max = maxActivePortfoliosFor(access);
  const used = await activeCount(auth.userId);

  const [row] = await db
    .select({
      slug: portfolioPages.slug,
      theme: portfolioPages.theme,
      status: portfolioPages.status,
      publishedAt: portfolioPages.publishedAt,
      updatedAt: portfolioPages.updatedAt,
    })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  return NextResponse.json({
    published: row?.status === "published",
    status: row?.status ?? null,
    slug: row?.slug ?? null,
    theme: row?.theme ?? null,
    url: row?.slug ? `${await baseUrl(request)}/p/${row.slug}` : null,
    publishedAt: row?.publishedAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    plan: {
      maxActive: max,
      used,
      remaining: Math.max(0, max - used),
      entitled: max > 0,
      upgradeUrl: UPGRADE_URL,
    },
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = publishPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_PAYLOAD",
      parsed.error.issues[0]?.message ?? "Data tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const { slug, themeId, data, fontSize, alignment } = parsed.data;

  const kosong = emptySectionIds(data);
  if (kosong.length >= 12) {
    return errorResponse(
      "PORTFOLIO_EMPTY",
      "Isi minimal satu bagian sebelum menerbitkan.",
      400,
      { emptySections: kosong },
    );
  }

  const access = await getUserAccess(auth.userId);
  const max = maxActivePortfoliosFor(access);
  if (max <= 0) {
    return errorResponse(
      "PORTFOLIO_PACKAGE_REQUIRED",
      "Paket Portfolio Web diperlukan untuk menerbitkan.",
      403,
      { upgradeUrl: UPGRADE_URL },
    );
  }

  const [existing] = await db
    .select({ id: portfolioPages.id, userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(eq(portfolioPages.userId, auth.userId))
    .limit(1);

  const used = await activeCount(auth.userId);
  const gate = canPublish({ maxActive: max, activeCount: used, alreadyOwns: !!existing });
  if (!gate.ok) {
    return errorResponse("QUOTA_EXCEEDED", quotaMessage(max, used), 403, {
      upgradeUrl: UPGRADE_URL,
    });
  }

  const clash = await db
    .select({ userId: portfolioPages.userId })
    .from(portfolioPages)
    .where(eq(portfolioPages.slug, slug))
    .limit(1);

  if (clash.length && clash[0].userId !== auth.userId) {
    return errorResponse(
      "SLUG_TAKEN",
      "Slug ini sudah dipakai pengguna lain. Coba nama lain.",
      409,
      {
        suggestions: suggestSlugs(data.formData.heroFirstName, data.formData.heroLastName, slug),
      },
    );
  }

  const now = new Date();
  const payload = {
    ...data,
    fontSize,
    // Alignment top-level dari dialog publish menang; kalau payload hanya
    // membawanya di dalam data (panggilan API langsung), jangan ditimpa
    // default {} supaya halaman /p/ tetap membaca perataan yang sama.
    alignment: Object.keys(alignment).length > 0 ? alignment : (data.alignment ?? alignment),
    sectionOrder: data.sectionOrder ?? null,
    sectionVisibility: data.sectionVisibility ?? null,
    sectionColors: data.sectionColors ?? null,
  };

  try {
    if (existing) {
      await db
        .update(portfolioPages)
        .set({
          slug,
          theme: themeId,
          status: "published",
          data: payload,
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(portfolioPages.id, existing.id));
    } else {
      await db.insert(portfolioPages).values({
        userId: auth.userId,
        slug,
        theme: themeId,
        status: "published",
        data: payload,
        publishedAt: now,
        updatedAt: now,
      });
    }
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      return errorResponse("SLUG_TAKEN", "Slug sudah dipakai pengguna lain.", 409);
    }
    throw err;
  }

  return NextResponse.json({
    published: true,
    slug,
    theme: themeId,
    url: `${await baseUrl(request)}/p/${slug}`,
    publishedAt: now.toISOString(),
    emptySections: kosong,
  });
});

export const PATCH = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db
    .update(portfolioPages)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(portfolioPages.userId, auth.userId));

  return NextResponse.json({ status: "archived", slugRetained: true });
});

export const DELETE = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db.delete(portfolioPages).where(eq(portfolioPages.userId, auth.userId));

  return NextResponse.json({ status: null, slugReleased: true });
});
