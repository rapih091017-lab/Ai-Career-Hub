import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { apiHandler, errorResponse, withAuth } from "@/lib/api-utils";
import { db } from "@/db";
import { portfolioDrafts } from "@/db/schema";
import { draftPayloadSchema } from "@/lib/portfolio/schema";

export const dynamic = "force-dynamic";

const pick = {
  id: portfolioDrafts.id,
  name: portfolioDrafts.name,
  data: portfolioDrafts.data,
  updatedAt: portfolioDrafts.updatedAt,
};

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const draftId = request.nextUrl.searchParams.get("draftId");

  const base = draftId
    ? and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId))
    : eq(portfolioDrafts.userId, auth.userId);

  const [row] = await db
    .select(pick)
    .from(portfolioDrafts)
    .where(base)
    .orderBy(desc(portfolioDrafts.updatedAt))
    .limit(1);

  if (!row) {
    return draftId
      ? errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404)
      : NextResponse.json({ draftId: null });
  }

  return NextResponse.json({
    draftId: row.id,
    name: row.name,
    data: row.data,
    updatedAt: (row.updatedAt ?? new Date()).toISOString(),
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = draftPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "INVALID_DATA",
      parsed.error.issues[0]?.message ?? "Data draft tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const [row] = await db
    .insert(portfolioDrafts)
    .values({
      userId: auth.userId,
      name: parsed.data.name,
      data: parsed.data.data as Record<string, unknown>,
    })
    .returning({ id: portfolioDrafts.id });

  return NextResponse.json({ draftId: row.id }, { status: 201 });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const raw = (await request.json().catch(() => null)) as {
    draftId?: string;
    name?: string;
    data?: unknown;
  } | null;

  if (!raw?.draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  const parsed = draftPayloadSchema.safeParse({ name: raw.name, data: raw.data });
  if (!parsed.success) {
    return errorResponse(
      "INVALID_DATA",
      parsed.error.issues[0]?.message ?? "Data draft tidak valid",
      400,
      { issues: parsed.error.issues },
    );
  }

  const [existing] = await db
    .select({ id: portfolioDrafts.id })
    .from(portfolioDrafts)
    .where(
      and(eq(portfolioDrafts.id, raw.draftId), eq(portfolioDrafts.userId, auth.userId)),
    )
    .limit(1);

  if (!existing) {
    return errorResponse("DRAFT_NOT_FOUND", "Draft tidak ditemukan", 404);
  }

  const [row] = await db
    .update(portfolioDrafts)
    .set({
      name: parsed.data.name,
      data: parsed.data.data as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(portfolioDrafts.id, raw.draftId))
    .returning({ updatedAt: portfolioDrafts.updatedAt });

  return NextResponse.json({ updatedAt: (row.updatedAt ?? new Date()).toISOString() });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => ({}))) as { draftId?: string };
  const draftId = request.nextUrl.searchParams.get("draftId") ?? body.draftId;

  if (!draftId) {
    return errorResponse("INVALID_BODY", "draftId wajib diisi", 400);
  }

  await db
    .delete(portfolioDrafts)
    .where(and(eq(portfolioDrafts.id, draftId), eq(portfolioDrafts.userId, auth.userId)));

  return NextResponse.json({ ok: true });
});
