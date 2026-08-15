import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

/** GET /api/cover-letter/[id] — detail satu surat */
export const GET = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { id } = await params;

  const [letter] = await db
    .select()
    .from(coverLetters)
    .where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)))
    .limit(1);

  if (!letter) {
    return errorResponse("NOT_FOUND", "Surat tidak ditemukan", 404);
  }

  return NextResponse.json(letter, { status: 200 });
});

/** PUT /api/cover-letter/[id] — update konten setelah diedit user */
export const PUT = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { id } = await params;
  const body = await request.json();
  const { content, subject, companyName, recipientName, letterNumber, attachment, jobSource, companyAddress, motivationReason, futurePlan } = body;

  if (typeof content !== "string" || content.trim().length === 0) {
    return errorResponse("INVALID_INPUT", "Field 'content' wajib diisi", 400);
  }

  const [existing] = await db
    .select({ id: coverLetters.id })
    .from(coverLetters)
    .where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)))
    .limit(1);

  if (!existing) {
    return errorResponse("NOT_FOUND", "Surat tidak ditemukan", 404);
  }

  const [updated] = await db
    .update(coverLetters)
    .set({
      content,
      subject: typeof subject === "string" ? subject : undefined,
      companyName: typeof companyName === "string" ? companyName : undefined,
      recipientName: typeof recipientName === "string" ? recipientName : undefined,
      letterNumber: typeof letterNumber === "string" ? letterNumber.trim() || null : undefined,
      attachment: typeof attachment === "string" ? attachment.trim() || null : undefined,
      jobSource: typeof jobSource === "string" ? jobSource.trim() || null : undefined,
      companyAddress: typeof companyAddress === "string" ? companyAddress.trim() || null : undefined,
      motivationReason: typeof motivationReason === "string" ? motivationReason.trim() || null : undefined,
      futurePlan: typeof futurePlan === "string" ? futurePlan.trim() || null : undefined,
      updatedAt: new Date(),
    })
    .where(eq(coverLetters.id, id))
    .returning();

  return NextResponse.json(updated, { status: 200 });
});

/** DELETE /api/cover-letter/[id] */
export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { id } = await params;

  const [existing] = await db
    .select({ id: coverLetters.id })
    .from(coverLetters)
    .where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)))
    .limit(1);

  if (!existing) {
    return errorResponse("NOT_FOUND", "Surat tidak ditemukan", 404);
  }

  await db.delete(coverLetters).where(eq(coverLetters.id, id));

  return NextResponse.json({ success: true }, { status: 200 });
});
