import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiHandler, errorResponse, checkQuota, logUsage } from "@/lib/api-utils";
import { db } from "@/db";
import { cvDocuments, coverLetters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { getLetterSystemPrompt, buildCoverLetterUserPrompt, type CoverLetterInput } from "@/lib/ai/prompts/cover-letter-v1";

/**
 * POST /api/cover-letter/generate
 *
 * Generate surat lamaran / cover letter dari data CV ATAU data manual (dari nol).
 * - Free users: kuota cover_letter (3x/bln)
 * - Premium: unlimited
 *
 * Body: { cvId?, language: "id"|"en", style: "formal"|"casual"|"ats"|"formal_lengkap",
 *         companyName?, recipientName?, letterNumber?, attachment?,
 *         position?, fullName?, phone?, email?, address?, summary?, jobDescription?,
 *         workHistory?, education?, skills?, certifications? }
 * - Wajib salah satu: cvId (data dari CV) atau position/fullName (data manual).
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const body = await request.json();
  const {
    cvId,
    language = "id",
    style = "formal",
    companyName,
    companyAddress,
    recipientName,
    letterNumber,
    attachment,
    jobSource,
    motivationReason,
    futurePlan,
    // Data manual — dipakai saat membuat surat dari nol (tanpa cvId)
    position: bodyPosition,
    fullName,
    phone,
    email,
    address,
    summary,
    jobDescription,
    workHistory,
    education,
    skills,
    certifications,
  } = body;

  if (!cvId && !String(bodyPosition ?? "").trim() && !String(fullName ?? "").trim()) {
    return errorResponse("INVALID_INPUT", "Sertakan 'cvId' atau data manual minimal (position/fullName)", 400);
  }
  if (language !== "id" && language !== "en") {
    return errorResponse("INVALID_INPUT", "language harus 'id' atau 'en'", 400);
  }
  if (!["formal", "casual", "ats", "formal_lengkap", "motivation"].includes(style)) {
    return errorResponse("INVALID_INPUT", "style harus 'formal', 'casual', 'ats', 'formal_lengkap', atau 'motivation'", 400);
  }
  if (style === "formal_lengkap" && language !== "id") {
    return errorResponse("INVALID_INPUT", "Gaya formal_lengkap hanya tersedia dalam Bahasa Indonesia", 400);
  }

  // ── 1. CEK KUOTA ──
  const quota = await checkQuota(userId, "cover_letter_generate");
  if (quota instanceof NextResponse) return quota;

  // ── 2. AMBIL DATA (dari CV atau data manual) ──
  let position = "";
  let input: CoverLetterInput;

  // Tanggal hari ini untuk surat (format sesuai bahasa)
  const todayDate =
    language === "en"
      ? new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  if (cvId) {
    const [cvDoc] = await db
      .select()
      .from(cvDocuments)
      .where(and(eq(cvDocuments.id, cvId), eq(cvDocuments.userId, userId)))
      .limit(1);

    if (!cvDoc) {
      return errorResponse("CV_NOT_FOUND", "CV tidak ditemukan", 404);
    }

    const tc = (cvDoc.tailoredContent ?? {}) as any;
    const personalInfo = tc?.personalInfo ?? {};
    const wh = tc?.workHistory ?? [];
    const edu = tc?.education ?? [];
    const sk = tc?.skills ?? [];
    const certs = tc?.certifications ?? [];

    position = cvDoc.jobTitle || (typeof body.position === "string" ? body.position : "");

    input = {
      language,
      style,
      dataSource: "cv",
      todayDate,
      fullName: personalInfo.fullName || "",
      phone: personalInfo.phone || "",
      email: personalInfo.email || "",
      address: personalInfo.address || "",
      summary: tc?.summary || "",
      position,
      companyName: companyName || "",
      companyAddress: typeof companyAddress === "string" ? companyAddress.trim() : "",
      recipientName: recipientName || "",
      jobSource: typeof jobSource === "string" ? jobSource.trim() : "",
      motivationReason: typeof motivationReason === "string" ? motivationReason.trim() : "",
      futurePlan: typeof futurePlan === "string" ? futurePlan.trim() : "",
      jobDescription: cvDoc.jobDescription || "",
      workHistory: (wh || []).map((w: any) => ({
        position: w.position || "",
        company: w.company || "",
        startDate: w.startDate || "",
        endDate: w.endDate || "",
        description: w.description || "",
      })),
      education: (edu || []).map((e: any) => ({
        degree: e.degree || "",
        field: e.field || "",
        institution: e.institution || "",
      })),
      skills: (sk || []).map((s: any) => ({ name: s.name || "" })),
      certifications: (certs || []).map((c: any) => ({ name: c.name || "" })),
    };
  } else {
    // Surat dari nol — data dikirim langsung dari form
    position = typeof bodyPosition === "string" ? bodyPosition.trim() : "";
    input = {
      language,
      style,
      dataSource: "manual",
      todayDate,
      fullName: typeof fullName === "string" ? fullName.trim() : "",
      phone: typeof phone === "string" ? phone.trim() : "",
      email: typeof email === "string" ? email.trim() : "",
      address: typeof address === "string" ? address.trim() : "",
      summary: typeof summary === "string" ? summary.trim() : "",
      position,
      companyName: typeof companyName === "string" ? companyName.trim() : "",
      companyAddress: typeof companyAddress === "string" ? companyAddress.trim() : "",
      recipientName: typeof recipientName === "string" ? recipientName.trim() : "",
      jobSource: typeof jobSource === "string" ? jobSource.trim() : "",
      motivationReason: typeof motivationReason === "string" ? motivationReason.trim() : "",
      futurePlan: typeof futurePlan === "string" ? futurePlan.trim() : "",
      jobDescription: typeof jobDescription === "string" ? jobDescription.trim() : "",
      workHistory: Array.isArray(workHistory) ? workHistory : [],
      education: Array.isArray(education) ? education : [],
      skills: Array.isArray(skills) ? skills : [],
      certifications: Array.isArray(certifications) ? certifications : [],
    };
  }

  // ── 3. PANGGIL AI (text mode) ──
  const userCtx = buildUserContext({
    jobTitle: position,
    industry: undefined,
    cvLang: language,
  });

  const content = await callAI<string>({
    systemPrompt: getLetterSystemPrompt(style),
    userPrompt: buildCoverLetterUserPrompt(input),
    temperature: style === "casual" || style === "motivation" ? 0.8 : 0.6,
    maxTokens: 1536,
    model: MODELS.CHAT,
    userContext: userCtx,
    responseFormat: "text",
  });

  // ── 4. SIMPAN ──
  // Subject menyesuaikan style — motivation letter bukan lamaran kerja,
  // jadi labelnya "Surat Motivasi" / "Motivation Letter".
  const isMotivation = style === "motivation";
  const target = companyName ? (language === "id" ? ` di ${companyName}` : ` at ${companyName}`) : "";
  const subject = isMotivation
    ? language === "id"
      ? `Surat Motivasi untuk ${position}${target}`
      : `Motivation Letter for ${position}${target}`
    : language === "id"
      ? `Lamaran Pekerjaan sebagai ${position}${target}`
      : `Application for ${position}${target}`;

  const [letter] = await db
    .insert(coverLetters)
    .values({
      userId,
      cvId: cvId || null,
      jobTitle: position,
      companyName: companyName || null,
      recipientName: recipientName || null,
      language,
      style,
      subject,
      letterNumber: typeof letterNumber === "string" ? letterNumber.trim() || null : null,
      attachment: typeof attachment === "string" ? attachment.trim() || null : null,
      jobSource: typeof jobSource === "string" ? jobSource.trim() || null : null,
      companyAddress: typeof companyAddress === "string" ? companyAddress.trim() || null : null,
      motivationReason: typeof motivationReason === "string" ? motivationReason.trim() || null : null,
      futurePlan: typeof futurePlan === "string" ? futurePlan.trim() || null : null,
      content,
    })
    .returning();

  // ── 5. CATAT PEMAKAIAN ──
  await logUsage(userId, "cover_letter_generate", letter.id);

  return NextResponse.json(
    {
      id: letter.id,
      subject,
      content,
      language,
      style,
      letterNumber: letter.letterNumber,
      attachment: letter.attachment,
      jobSource: letter.jobSource,
      companyAddress: letter.companyAddress,
      motivationReason: letter.motivationReason,
      futurePlan: letter.futurePlan,
      createdAt: letter.createdAt,
    },
    { status: 201 },
  );
});
