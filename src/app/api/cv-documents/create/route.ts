import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { masterProfiles, cvDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { GENERATOR_PROMPT_V2 } from "@/lib/ai/prompts/generator-v2";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const { jobTitle, jobDescription, templateId, useProfile = true, rawText } = body;

  // Always fetch profile to get a valid FK id (masterProfileId is NOT NULL in schema)
  const [masterProfile] = await db
    .select()
    .from(masterProfiles)
    .where(eq(masterProfiles.userId, session.user.id))
    .limit(1);

  // Profile is required for FK reference (masterProfileId is NOT NULL in schema)
  if (!masterProfile) {
    return NextResponse.json(
      { error: "PROFILE_NOT_FOUND", message: "Silakan isi profil terlebih dahulu", redirectUrl: "/profile" },
      { status: 404 },
    );
  }

  // Only copy profile content when useProfile=true
  const tailoredContent = useProfile
    ? {
        personalInfo: masterProfile.personalInfo ?? null,
        workHistory: masterProfile.workHistory ?? null,
        education: masterProfile.education ?? null,
        organisations: masterProfile.organisations ?? null,
        skills: masterProfile.skills ?? null,
      }
    : null;

  // ── AI GENERATION: if rawText provided, parse with AI ──
  let aiGeneratedData: any = null;
  if (rawText && typeof rawText === "string" && rawText.trim().length > 20) {
    try {
      aiGeneratedData = await callAI({
        systemPrompt: GENERATOR_PROMPT_V2,
        userPrompt: rawText.trim(),
        temperature: 0.2,
        model: MODELS.CHAT,
        maxTokens: 4096,
      });
    } catch (err) {
      console.error("AI Generator error (non-fatal):", err);
      // Non-fatal — tetap lanjut tanpa AI data
    }
  }

  // Merge AI-generated structured data into tailoredContent
  // AI data overrides profile data when both exist
  const mergedContent = aiGeneratedData
    ? {
        ...(tailoredContent || {}),
        personalInfo: {
          ...(tailoredContent?.personalInfo || {}),
          ...(aiGeneratedData.personal || aiGeneratedData.personalInfo || {}),
        },
        workHistory:
          aiGeneratedData.experience || aiGeneratedData.workHistory || tailoredContent?.workHistory || [],
        education: aiGeneratedData.education || tailoredContent?.education || [],
        skills: aiGeneratedData.skills || tailoredContent?.skills || [],
        organisations:
          aiGeneratedData.organisations ||
          aiGeneratedData.organizations ||
          aiGeneratedData.organisation ||
          tailoredContent?.organisations ||
          [],
      }
    : tailoredContent;

  const [newDoc] = await db
    .insert(cvDocuments)
    .values({
      userId: session.user.id,
      masterProfileId: masterProfile.id,
      jobTitle: jobTitle?.trim() || "",
      jobDescription: jobDescription?.trim() || "",
      tailoredContent: mergedContent,
      templateId: templateId?.trim() || DEFAULT_TEMPLATE_ID,
    })
    .returning();

  return NextResponse.json(newDoc, { status: 201 });
}
