import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { masterProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiHandler } from "@/lib/api-utils";

export const POST = apiHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 }
    );
  }

  const existing = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, session.user.id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "PROFILE_ALREADY_EXISTS", message: "Profil sudah pernah dibuat. Gunakan endpoint update untuk mengubah." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { personalInfo, workHistory, education, organisations, skills } = body;

  const [newProfile] = await db
    .insert(masterProfiles)
    .values({
      userId: session.user.id,
      personalInfo: personalInfo ?? null,
      workHistory: workHistory ?? null,
      education: education ?? null,
      organisations: organisations ?? null,
      skills: skills ?? null,
    })
    .returning();

  return NextResponse.json(newProfile, { status: 201 });
});
