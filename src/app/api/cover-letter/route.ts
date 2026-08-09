import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler } from "@/lib/api-utils";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

/**
 * GET /api/cover-letter?cvId=xxx | ?standalone=1
 *
 * Daftar surat lamaran milik user.
 * - ?cvId=xxx : hanya surat milik CV tertentu
 * - ?standalone=1 : hanya surat yang dibuat dari nol (tanpa CV)
 * - tanpa param : semua surat user
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const cvId = request.nextUrl.searchParams.get("cvId");
  const standalone = request.nextUrl.searchParams.get("standalone");

  const where = cvId
    ? and(eq(coverLetters.userId, userId), eq(coverLetters.cvId, cvId))
    : standalone === "1"
      ? and(eq(coverLetters.userId, userId), isNull(coverLetters.cvId))
      : eq(coverLetters.userId, userId);

  const letters = await db
    .select({
      id: coverLetters.id,
      cvId: coverLetters.cvId,
      jobTitle: coverLetters.jobTitle,
      companyName: coverLetters.companyName,
      language: coverLetters.language,
      style: coverLetters.style,
      subject: coverLetters.subject,
      letterNumber: coverLetters.letterNumber,
      attachment: coverLetters.attachment,
      createdAt: coverLetters.createdAt,
      updatedAt: coverLetters.updatedAt,
    })
    .from(coverLetters)
    .where(where)
    .orderBy(desc(coverLetters.updatedAt));

  return NextResponse.json(letters, { status: 200 });
});

/**
 * GET /api/cover-letter/[id] — detail satu surat (via [id]/route.ts)
 */
