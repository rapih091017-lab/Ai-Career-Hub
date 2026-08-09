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

  /* ── Normalisasi output AI generator ke shape data CV ──────────────
   * Prompt generator mengembalikan field dengan nama berbeda dari data model
   * CV (mis. personal.name vs fullName, experience[].bullets vs description,
   * skills sebagai objek {technical,soft,languages} vs array [{name}]).
   * Tanpa normalisasi ini, CV hasil AI-generate akan kehilangan nama,
   * deskripsi pengalaman, dan bisa crash saat builder memanggil skills.map().
   */
  function normalizeAiData(ai: any) {
    const personal = ai.personal || ai.personalInfo || {};

    const workHistory = (ai.experience || ai.workHistory || []).map((w: any) => ({
      position: w.position || w.jobTitle || "",
      company: w.company || "",
      location: w.location || "",
      startDate: w.start_date || w.startDate || "",
      endDate: w.end_date || w.endDate || "",
      description: Array.isArray(w.bullets)
        ? w.bullets.filter(Boolean).join("\n")
        : w.description || "",
    }));

    const education = (ai.education || []).map((e: any) => ({
      institution: e.institution || "",
      degree: e.degree || "",
      field: e.field || "",
      startDate: e.start_date || e.startDate || "",
      endDate: e.end_date || e.endDate || "",
      gpa: e.gpa || null,
    }));

    // skills bisa array [{name}] ATAU objek {technical, soft, languages}
    // level di-default "intermediate" — konsisten dengan builder (useFetchCvData)
    const rawSkills = ai.skills;
    const skills: { name: string; level: "beginner" | "intermediate" | "advanced"; category?: "technical" | "soft" | "tools" }[] = [];
    if (Array.isArray(rawSkills)) {
      for (const s of rawSkills) {
        if (!s) continue;
        if (typeof s === "string") {
          if (s.trim()) skills.push({ name: s.trim(), level: "intermediate" });
        } else if (s.name?.trim()) {
          skills.push({ name: s.name.trim(), level: s.level || "intermediate", category: s.category || s.type || undefined });
        }
      }
    } else if (rawSkills && typeof rawSkills === "object") {
      const categories = [
        ["technical", rawSkills.technical],
        ["soft", rawSkills.soft],
        ["tools", rawSkills.tools || rawSkills.languages],
      ] as const;
      for (const [category, list] of categories) {
        if (!Array.isArray(list)) continue;
        for (const s of list) {
          if (!s) continue;
          if (typeof s === "string") {
            if (s.trim()) skills.push({ name: s.trim(), level: "intermediate", category });
          } else if (s.name?.trim()) {
            skills.push({ name: s.name.trim(), level: s.level || "intermediate", category });
          }
        }
      }
    }

    const certifications = (ai.certifications || []).map((c: any) => ({
      name: c.name || "",
      issuer: c.issuer || "",
      year: c.date || c.year || "",
    }));

    return {
      personalInfo: {
        fullName: personal.name || "",
        phone: personal.phone || "",
        email: personal.email || "",
        address: personal.location || personal.address || "",
        linkedin: personal.linkedin || "",
        portfolioUrl: personal.portfolio || personal.portfolioUrl || "",
        summary: personal.summary || "",
        professionalTitle: personal.title || "",
      },
      workHistory,
      education,
      skills,
      certifications,
    };
  }

  // Merge AI-generated structured data into tailoredContent
  // AI data overrides profile data; profil dipakai sebagai fallback per-field.
  // Kolom tailoredContent di DB adalah JSON — tipe longgar (any) agar
  // menyatu dengan shape masterProfile & shape hasil normalisasi AI.
  let mergedContent: any = tailoredContent;
  if (aiGeneratedData) {
    const aiData = normalizeAiData(aiGeneratedData);
    // Jangan timpa field profil dengan string kosong dari AI
    const nonEmptyPersonal = Object.fromEntries(
      Object.entries(aiData.personalInfo).filter(
        ([, v]) => typeof v === "string" && v.trim() !== "",
      ),
    );

    mergedContent = {
      ...(tailoredContent || {}),
      personalInfo: {
        ...((tailoredContent?.personalInfo as any) || {}),
        ...nonEmptyPersonal,
      },
      workHistory:
        aiData.workHistory.length > 0
          ? aiData.workHistory
          : (tailoredContent?.workHistory as any) || [],
      education:
        aiData.education.length > 0
          ? aiData.education
          : (tailoredContent?.education as any) || [],
      skills:
        aiData.skills.length > 0
          ? aiData.skills
          : (tailoredContent?.skills as any) || [],
      organisations: (tailoredContent?.organisations as any) || [],
      certifications:
        aiData.certifications.length > 0
          ? aiData.certifications
          : (tailoredContent as any)?.certifications || [],
    };
  }

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
