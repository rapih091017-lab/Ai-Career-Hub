import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { masterProfiles, usageLogs } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { PORTFOLIO_PROMPT_V1 } from "@/lib/ai/prompts/portfolio-v1";
import { getUserAccess } from "@/lib/access";

interface SuggestResponse {
  hero: {
    headline: string;
    subheadline: string;
    cta_primary: string;
    cta_secondary: string;
  };
  about: {
    meta_description: string;
    paragraph_1: string;
    paragraph_2: string;
    paragraph_3: string | null;
  };
  experience_highlights: {
    company: string;
    role: string;
    period: string;
    headline: string;
    impact: string;
  }[];
  skills_display: {
    primary: string[];
    secondary: string[];
    tagline: string;
  };
  contact_cta: {
    headline: string;
    subtext: string;
    button_text: string;
  };
  seo: {
    page_title: string;
    keywords: string[];
  };
}

/* ── Build a text context block from CV data (CvData format) ── */
function buildCvContext(cv: any): string {
  const workLines = (cv.workHistory || []).map(
    (w: any) => `${w.position || "—"} at ${w.company || "—"} — ${w.description || ""}`,
  );
  const eduLines = (cv.education || []).map(
    (e: any) => `${e.degree || ""} ${e.field || ""} at ${e.institution || "—"}`,
  );
  const orgLines = (cv.organisations || []).map(
    (o: any) => `${o.position || ""} at ${o.name || "—"} — ${o.description || ""}`,
  );
  const skillNames = (cv.skills || []).map((s: any) => s.name).filter(Boolean);

  return `
Nama: ${cv.fullName || "(belum diisi)"}
Judul Posisi: ${cv.jobTitle || "(belum diisi)"}
Ringkasan: ${cv.summary || "(belum diisi)"}
Deskripsi Pekerjaan Target: ${cv.jobDescription || "(tidak ada)"}
Pengalaman Kerja:
${workLines.map((w: string) => `- ${w}`).join("\n") || "(belum ada)"}
Pendidikan:
${eduLines.map((e: string) => `- ${e}`).join("\n") || "(belum ada)"}
Skill: ${skillNames.join(", ") || "(belum ada)"}
Organisasi:
${orgLines.map((o: string) => `- ${o}`).join("\n") || "(belum ada)"}
  `.trim();
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "Anda harus login terlebih dahulu" },
      { status: 401 },
    );
  }

  // ── Cek kuota ──
  const access = await getUserAccess(session.user.id);
  const isPremium = access.isPremium;
  const FREE_LIMIT = 2;

  if (!isPremium) {
    const [usageCount] = await db
      .select({ count: count() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, session.user.id),
          eq(usageLogs.actionType, "portfolio_generate"),
        )
      );

    if (usageCount.count >= FREE_LIMIT) {
      return NextResponse.json(
        {
          error: "QUOTA_EXCEEDED",
          message: `Batas gratis generate portfolio sudah terpakai (${FREE_LIMIT}/${FREE_LIMIT}). Upgrade ke Premium untuk unlimited.`,
        },
        { status: 403 }
      );
    }
  }

  // ── Baca body request ──
  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    console.warn("Portfolio suggest: invalid JSON body, falling back to DB profile");
  }
  const { cvData } = body;

  // ── Build context: dari CV data atau dari DB profile ──
  let profileContext: string;
  let userCtx = undefined;

  if (cvData && typeof cvData === "object") {
    // Generate dari CV data yang dikirim dari frontend
    profileContext = buildCvContext(cvData);
    userCtx = buildUserContext({
      jobTitle: cvData.jobTitle || null,
      industry: undefined,
    });
  } else {
    // Fallback: ambil profile dari DB (existing behavior)
    const [profile] = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, session.user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "PROFILE_NOT_FOUND", message: "Silakan isi profil terlebih dahulu" },
        { status: 404 },
      );
    }

    const pi = (profile.personalInfo || {}) as {
      fullName: string | null;
      phone: string | null;
      email: string | null;
      address: string | null;
      linkedin: string | null;
      summary: string | null;
    };
    const fullName = pi.fullName || "";
    const summary = pi.summary || "";
    const workHistory = (profile.workHistory || []).map(
      (w: any) => `${w.position} at ${w.company} — ${w.description || ""}`,
    );
    const education = (profile.education || []).map(
      (e: any) => `${e.degree} ${e.field || ""} at ${e.institution}`,
    );
    const skills = (profile.skills || []).map((s: any) => s.name);
    const organisations = (profile.organisations || []).map(
      (o: any) => `${o.position} at ${o.name} — ${o.description || ""}`,
    );

    profileContext = `
Nama: ${fullName || "(belum diisi)"}
Ringkasan: ${summary || "(belum diisi)"}
Pengalaman Kerja:
${workHistory.map((w: string) => `- ${w}`).join("\n") || "(belum ada)"}
Pendidikan:
${education.map((e: string) => `- ${e}`).join("\n") || "(belum ada)"}
Skill: ${skills.join(", ") || "(belum ada)"}
Organisasi:
${organisations.map((o: string) => `- ${o}`).join("\n") || "(belum ada)"}
`.trim();

    userCtx = buildUserContext({
      jobTitle: (profile.personalInfo as any)?.desiredPosition || null,
      industry: (profile.personalInfo as any)?.industry || undefined,
    });
  }

  try {
    const suggestions = await callAI<SuggestResponse>({
      systemPrompt: PORTFOLIO_PROMPT_V1,
      userPrompt: `=== DATA PROFIL USER ===
${profileContext}`,
      temperature: 0.75,
      maxTokens: 4096,
      model: MODELS.CHAT,
      taskType: "portfolio",
      userContext: userCtx,
    });

    // Catat pemakaian
    await db.insert(usageLogs).values({
      userId: session.user.id,
      actionType: "portfolio_generate",
    });

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error("AI Portfolio Suggest Error:", error);
    return NextResponse.json(
      { error: "AI_ERROR", message: "Gagal mendapatkan saran AI. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
