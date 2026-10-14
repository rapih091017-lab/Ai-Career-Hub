import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * Status langkah "isi profil".
 *
 * GET  → apakah pengguna ini baru (belum pernah melewati langkah isi profil).
 * POST → tandai selesai, baik karena mengisi profil atau memilih melompat.
 *
 * Popup hanya boleh muncul satu kali, jadi penandainya disimpan di server, bukan
 * di localStorage: logout dari browser lain tidak memunculkan ulang.
 */
export const GET = apiHandler(async () => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const [row] = await db
    .select({ completedAt: users.onboardingCompletedAt })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);

  if (!row) return errorResponse("ACCOUNT_NOT_FOUND", "Akun tidak ditemukan.", 404);

  return NextResponse.json({ isNewUser: row.completedAt === null });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  await db
    .update(users)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(users.id, auth.userId));

  return NextResponse.json({ ok: true });
});