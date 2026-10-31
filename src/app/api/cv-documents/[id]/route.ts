import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { apiHandler, errorResponse, noCache } from "@/lib/api-utils";
import { TEMPLATE_STYLES } from "@/components/cv-templates";

/** Batas body PUT. CV teks + layout jauh di bawah ini; lebih besar = salah kirim atau penyalahgunaan. */
const CV_PUT_MAX_BYTES = 200 * 1024;

const PutSchema = z.object({
  // Isi CV dirapikan saat muat (normalizeCvDocument); di sini cukup pastikan objek.
  tailoredContent: z.object({}).passthrough().optional(),
  templateId: z
    .string()
    .refine((id) => Object.prototype.hasOwnProperty.call(TEMPLATE_STYLES, id), "Template tidak dikenal")
    .optional(),
});

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

  await db.delete(cvDocuments).where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, userId)));
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
    headers: noCache(),
  });
});

export const PUT = apiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await authenticate(request, params);
  if ('error' in ctx) return ctx.error;
  const { userId, id } = ctx;

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > CV_PUT_MAX_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "Data CV terlalu besar untuk disimpan.", 413);
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > CV_PUT_MAX_BYTES) {
    return errorResponse("PAYLOAD_TOO_LARGE", "Data CV terlalu besar untuk disimpan.", 413);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return errorResponse("INVALID_JSON", "Data yang dikirim bukan JSON yang valid.", 400);
  }
  const parsed = PutSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", "Data CV tidak valid.", 400);
  }
  const { tailoredContent, templateId } = parsed.data;

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

  const updateData: Partial<typeof cvDocuments.$inferInsert> = {};
  // Bentuk isi divalidasi longgar (passthrough); kolom jsonb menerima objek apa pun.
  if (tailoredContent !== undefined) updateData.tailoredContent = tailoredContent as typeof cvDocuments.$inferInsert["tailoredContent"];
  if (templateId !== undefined) updateData.templateId = templateId;
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(cvDocuments)
    .set(updateData)
    .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, userId)))
    .returning();

  return NextResponse.json(updated, { status: 200 });
});
