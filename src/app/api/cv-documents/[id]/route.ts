import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { apiHandler, staleWhileRevalidate } from "@/lib/api-utils";

async function authenticate(request: NextRequest, params: Promise<{ id: string }>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 },
    )} as const;
  }
  const { id } = await params;
  return { session, userId: session.user.id, id };
}

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(request, params);
  if ('error' in ctx) return ctx.error;
  const { userId, id } = ctx;

  const [existing] = await db
    .select({ id: cvDocuments.id })
    .from(cvDocuments)
    .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "CV_NOT_FOUND", message: "Dokumen CV tidak ditemukan atau bukan milik Anda" },
      { status: 404 },
    );
  }

  await db.delete(cvDocuments).where(eq(cvDocuments.id, id));
  return NextResponse.json({ success: true }, { status: 200 });
});

export const GET = apiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(request, params);
  if ('error' in ctx) return ctx.error;
  const { userId, id } = ctx;

  const [doc] = await db
    .select()
    .from(cvDocuments)
    .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, userId)))
    .limit(1);

  if (!doc) {
    return NextResponse.json(
      { error: "CV_NOT_FOUND", message: "Dokumen CV tidak ditemukan atau bukan milik Anda" },
      { status: 404 },
    );
  }

  return NextResponse.json(doc, {
    status: 200,
    headers: staleWhileRevalidate(30),
  });
});

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(request, params);
  if ('error' in ctx) return ctx.error;
  const { userId, id } = ctx;

  const body = await request.json();
  const { tailoredContent, templateId } = body;

  const [existing] = await db
    .select()
    .from(cvDocuments)
    .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "CV_NOT_FOUND", message: "Dokumen CV tidak ditemukan atau bukan milik Anda" },
      { status: 404 },
    );
  }

  const updateData: Record<string, any> = {};
  if (tailoredContent !== undefined) updateData.tailoredContent = tailoredContent;
  if (templateId !== undefined) updateData.templateId = templateId;
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(cvDocuments)
    .set(updateData)
    .where(eq(cvDocuments.id, id))
    .returning();

  return NextResponse.json(updated, { status: 200 });
});
