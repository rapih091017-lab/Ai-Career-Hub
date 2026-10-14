import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { masterProfiles, usageLogs, users } from "@/db/schema";
import { eq, and, count, gte, asc } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { PORTFOLIO_PROMPT_V1 } from "@/lib/ai/prompts/portfolio-v1";
import { getUserAccess } from "@/lib/access";
import { PORTFOLIO_TRIAL_DAYS } from "@/lib/package-catalog-static";

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
    (w: any) => `${w.position || "-"} at ${w.company || "-"}, ${w.description || ""}`,
  );
  const eduLines = (cv.education || []).map(
    (e: any) => `${e.degree || ""} ${e.field || ""} at ${e.institution || "-"}`,
  );
  const orgLines = (cv.organisations || []).map(
    (o: any) => `${o.position || ""} at ${o.name || "-"}, ${o.description || ""}`,
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
  // Pakai limit dari sistem akses (getUserAccess), konsisten dengan fitur lain.
  // Paket free punya jatah percobaan 2 hari (lihat PORTFOLIO_TRIAL_DAYS), jadi
// nilai di sini selalu angka, tidak pernah `false`.
  const access = await getUserAccess(session.user.id);
  const portfolioLimit = access.limits.portfolio_web;

  if (portfolioLimit === false) {
    return NextResponse.json(
      {
        error: "FEATURE_NOT_AVAILABLE",
        message: "Portfolio AI tidak tersedia di paket kamu. Paket Pro dan Max sudah memuatnya.",
      },
      { status: 403 }
    );
  }

  if (portfolioLimit !== "unlimited") {
    // Free user gets a two-day trial, not a monthly allowance. Trial starts at
    // their first portfolio ever (or account creation), and users who already
    // generated one keep the old monthly allowance so nobody loses access.
    const isPaidPortfolio = Boolean(access.purchasedFeatures.portfolio_web);
    if (!isPaidPortfolio) {
      const [firstEver] = await db
        .select({ createdAt: usageLogs.createdAt })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, session.user.id),
            eq(usageLogs.actionType, "portfolio_generate"),
          ),
        )
        .orderBy(asc(usageLogs.createdAt))
        .limit(1);

      if (!firstEver) {
        const [account] = await db
          .select({ createdAt: users.createdAt })
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1);
        const trialEnd = new Date(
          (account?.createdAt ?? new Date()).getTime() + PORTFOLIO_TRIAL_DAYS * 86_400_000,
        );
        if (new Date() > trialEnd) {
          return NextResponse.json(
            {
              error: "PORTFOLIO_TRIAL_EXPIRED",
              message: `Percobaan portfolio ${PORTFOLIO_TRIAL_DAYS} hari sudah habis. Portfolio web tersedia di paket Pro dan Max.`,
            },
            { status: 403 },
          );
        }
      }
    }

    // Hitung pemakaian bulan berjalan, konsisten dengan checkQuota di fitur lain
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [usageCount] = await db
      .select({ count: count() })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, session.user.id),
          eq(usageLogs.actionType, "portfolio_generate"),
          gte(usageLogs.createdAt, firstOfMonth),
        )
      );

    if (usageCount.count >= portfolioLimit) {
      return NextResponse.json(
        {
          error: "QUOTA_EXCEEDED",
          message: `Batas generate portfolio sudah terpakai (${portfolioLimit}/${portfolioLimit}). Paket Pro memberi portfolio untuk 30 hari penuh.`,
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
      (w: any) => `${w.position} at ${w.company}, ${w.description || ""}`,
    );
    const education = (profile.education || []).map(
      (e: any) => `${e.degree} ${e.field || ""} at ${e.institution}`,
    );
    const skills = (profile.skills || []).map((s: any) => s.name);
    const organisations = (profile.organisations || []).map(
      (o: any) => `${o.position} at ${o.name}, ${o.description || ""}`,
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
