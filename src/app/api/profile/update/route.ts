import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { masterProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiHandler } from "@/lib/api-utils";

export const PUT = apiHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { personalInfo, workHistory, education, organisations, skills } = body;

  const [updatedProfile] = await db
    .update(masterProfiles)
    .set({
      personalInfo: personalInfo ?? null,
      workHistory: workHistory ?? null,
      education: education ?? null,
      organisations: organisations ?? null,
      skills: skills ?? null,
      updatedAt: new Date(),
    })
    .where(eq(masterProfiles.userId, session.user.id))
    .returning();

  if (!updatedProfile) {
    return NextResponse.json(
      { error: "PROFILE_NOT_FOUND", message: "Profil belum dibuat" },
      { status: 404 }
    );
  }

  return NextResponse.json(updatedProfile, { status: 200 });
});
