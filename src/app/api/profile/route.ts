import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { masterProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiHandler, staleWhileRevalidate } from "@/lib/api-utils";

export const GET = apiHandler(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 }
    );
  }

  const profile = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, session.user.id))
    .limit(1);

  if (profile.length === 0) {
    return NextResponse.json(
      { error: "PROFILE_NOT_FOUND", message: "Profil belum dibuat" },
      { status: 404 }
    );
  }

  return NextResponse.json(profile[0], {
    status: 200,
    headers: staleWhileRevalidate(30),
  });
});
