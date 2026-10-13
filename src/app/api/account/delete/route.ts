import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse } from "@/lib/api-utils";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/** Kata yang harus diketik pengguna. Mempercepat penghapusan tidak Sendirian. */
const CONFIRM_WORD = "HAPUS";

/**
 * POST /api/account/delete
 *
 * Menghapus akun beserta seluruh isinya.
 *
 * Janji "kamu bisa menghapus akun dan data kapan saja" ada di halaman Privacy,
 * FAQ, dan Syarat. Tanpa endpoint ini, janji itu tidak bisa dibuktikan pembeli
 * mana pun yang teliti.
 *
 * Semua tabel milik pengguna memakai `on delete cascade`, jadi menghapus satu
 * baris `users` menghapus CV, draft portfolio, aset gambar, pembayaran, riwayat
 * penggunaan, dan semua data lain milik akun itu.
 *
 * Penghapusan tidak dapat dibatalkan.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const confirm = typeof body?.confirm === "string" ? body.confirm.trim().toUpperCase() : "";

  if (confirm !== CONFIRM_WORD) {
    return errorResponse(
      "CONFIRMATION_REQUIRED",
      `Ketik ${CONFIRM_WORD} untuk menghapus akun.`,
      400,
    );
  }

  const deleted = await db
    .delete(users)
    .where(eq(users.id, auth.userId))
    .returning({ id: users.id });

  if (deleted.length === 0) {
    return errorResponse("ACCOUNT_NOT_FOUND", "Akun tidak ditemukan.", 404);
  }

  // Sengaja tidak mengembalikan data apa pun: akun sudah tidak ada.
  return NextResponse.json({ ok: true });
});