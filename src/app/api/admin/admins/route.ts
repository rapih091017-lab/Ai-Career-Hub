import { NextRequest, NextResponse } from "next/server";
import { withAdmin, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

/**
 * Admin tambahan yang dikelola dari dashboard.
 * - Sumber pertama tetap ADMIN_EMAILS (environment variable) dan ditampilkan
 *   sebagai daftar terpisah yang tidak dapat dihapus dari sini.
 * - Tabel admin_users untuk admin yang bisa ditambah/dihapus kapan saja.
 */

function envAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GET = apiHandler(async () => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const rows = await db
    .select()
    .from(adminUsers)
    .orderBy(asc(adminUsers.createdAt));

  return NextResponse.json({
    envEmails: envAdminEmails(),
    admins: rows,
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : null;

  if (!EMAIL_REGEX.test(email) || email.length > 200) {
    return errorResponse("INVALID_INPUT", "Alamat email tidak valid.", 400);
  }
  if (envAdminEmails().includes(email)) {
    return errorResponse("ALREADY_ENV_ADMIN", "Email ini sudah admin dari environment variable.", 400);
  }

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (existing.length > 0) {
    return errorResponse("ALREADY_ADMIN", "Email ini sudah terdaftar sebagai admin.", 400);
  }

  const [created] = await db
    .insert(adminUsers)
    .values({ email, note, })
    .returning();

  return NextResponse.json({ admin: created }, { status: 201 });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const auth = await withAdmin();
  if (auth instanceof NextResponse) return auth;

  const email = (new URL(request.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return errorResponse("INVALID_INPUT", "Alamat email tidak valid.", 400);
  }
  if (email === auth.email.toLowerCase()) {
    return errorResponse("CANNOT_REMOVE_SELF", "Kamu tidak bisa menghapus akses admin milikmu sendiri.", 400);
  }

  const removed = await db
    .delete(adminUsers)
    .where(eq(adminUsers.email, email))
    .returning({ email: adminUsers.email });

  return NextResponse.json({ removed: removed.length });
});
