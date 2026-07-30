import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiHandler, withAdmin } from "@/lib/api-utils";

export const POST = apiHandler(async (request: Request) => {
  // ── Auth: must be admin ──
  const admin = await withAdmin();
  if (admin instanceof NextResponse) return admin;

  // ── Parse body ──
  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "userId wajib diisi" },
      { status: 400 }
    );
  }

  // ── Cek user exists ──
  const [targetUser] = await db
    .select({
      id: users.id,
      status: users.status,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "User tidak ditemukan" },
      { status: 404 }
    );
  }

  if (targetUser.status === "active") {
    return NextResponse.json(
      { message: `User ${targetUser.email} sudah active.` },
      { status: 200 }
    );
  }

  // ── Approve: set status ke active ──
  await db
    .update(users)
    .set({ status: "active" })
    .where(eq(users.id, userId));

  return NextResponse.json(
    {
      message: `User ${targetUser.name || targetUser.email} berhasil diaktifkan!`,
    },
    { status: 200 }
  );
});
