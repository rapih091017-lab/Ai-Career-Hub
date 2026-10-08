import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, apiHandler, errorResponse, logUsage } from "@/lib/api-utils";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { PROFILE_IMPORT_PROMPT } from "@/lib/ai/prompts/profile-import-v1";

/**
 * POST /api/profile/import
 *
 * Mengubah teks mentah (CV / salinan profil LinkedIn) menjadi struktur profil.
 * Endpoint ini hanya MEMBACA teks dan mengembalikan hasil parseian; penyimpanan
 * dilakukan user lewat form profil (PUT /api/profile/update) setelah review,
 * supaya data yang salah tidak menimpa profil tanpa sepengetahuan user.
 *
 * Sengaja TANPA kuota: fitur ini bagian dari onboarding, dan biaya per panggilan
 * kecil (satu kali per user, bukan fitur berulang).
 */

const MAX_TEXT_LENGTH = 60000;

const textItem = (max: number) => z.string().catch("").transform((v) => v.trim().slice(0, max));
const dateText = () => z.string().catch("").transform((v) => v.trim().slice(0, 10));

const importedProfileSchema = z.object({
  personalInfo: z
    .object({
      fullName: textItem(200),
      phone: textItem(50),
      email: textItem(200),
      address: textItem(300),
      linkedin: textItem(300),
      /** Website / portofolio (opsional), ikut diisi bila ada di teks CV. */
      portfolioUrl: textItem(300),
      summary: textItem(2000),
    })
    .catch({ fullName: "", phone: "", email: "", address: "", linkedin: "", portfolioUrl: "", summary: "" }),
  workHistory: z
    .array(
      z.object({
        id: textItem(40),
        company: textItem(200),
        position: textItem(200),
        startDate: dateText(),
        endDate: dateText(),
        description: textItem(2000),
        isPresent: z.boolean().catch(false),
      }),
    )
    .catch([]),
  education: z
    .array(
      z.object({
        id: textItem(40),
        institution: textItem(200),
        degree: textItem(200),
        field: textItem(200),
        startDate: dateText(),
        endDate: dateText(),
        gpa: textItem(20),
        isPresent: z.boolean().catch(false),
      }),
    )
    .catch([]),
  organisations: z
    .array(
      z.object({
        id: textItem(40),
        name: textItem(200),
        position: textItem(200),
        startDate: dateText(),
        endDate: dateText(),
        description: textItem(2000),
        isPresent: z.boolean().catch(false),
      }),
    )
    .catch([]),
  skills: z
    .array(
      z.object({
        id: textItem(40),
        name: textItem(120),
        level: z.enum(["beginner", "intermediate", "advanced"]).catch("intermediate"),
      }),
    )
    .catch([]),
  certifications: z
    .array(
      z.object({
        id: textItem(40),
        name: textItem(200),
        issuer: textItem(200),
        year: textItem(10),
      }),
    )
    .catch([]),
});

/** ID dari AI bisa kosong; isi dengan pola sederhana supaya editor form aman. */
function withIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  return items.map((item, index) => ({ ...item, id: item.id || `${prefix}${index + 1}` }));
}

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (text.length < 50) {
    return errorResponse(
      "INVALID_INPUT",
      "Teks terlalu pendek. Tempel teks CV atau profil yang lebih lengkap.",
      400,
    );
  }

  let aiResult: unknown;
  try {
    aiResult = await callAI<unknown>({
      systemPrompt: PROFILE_IMPORT_PROMPT,
      userPrompt: text.slice(0, MAX_TEXT_LENGTH),
      temperature: 0.1,
      model: MODELS.CHAT,
      maxTokens: 4096,
    });
  } catch (err) {
    console.error("[profile/import] AI gagal:", err instanceof Error ? err.message : err);
    return errorResponse(
      "AI_FAILED",
      "AI sedang tidak bisa memproses teks ini. Coba lagi sebentar lagi.",
      502,
    );
  }

  const parsed = importedProfileSchema.safeParse(aiResult);
  if (!parsed.success) {
    return errorResponse(
      "PARSE_FAILED",
      "AI tidak bisa menyusun profil dari teks ini. Coba tempel teks CV yang lebih lengkap.",
      422,
    );
  }

  const data = parsed.data;
  const profile = {
    personalInfo: data.personalInfo,
    workHistory: withIds(
      data.workHistory
        .filter((item) => item.company || item.position)
        .slice(0, 20),
      "w",
    ),
    education: withIds(
      data.education
        .filter((item) => item.institution || item.degree)
        .slice(0, 10),
      "e",
    ),
    organisations: withIds(
      data.organisations
        .filter((item) => item.name || item.position)
        .slice(0, 10),
      "o",
    ),
    skills: withIds(
      data.skills
        .filter((item) => item.name)
        .slice(0, 60),
      "s",
    ),
    certifications: withIds(
      data.certifications
        .filter((item) => item.name)
        .slice(0, 20),
      "c",
    ),
  };

  await logUsage(auth.userId, "profile_import");

  return NextResponse.json({ profile }, { status: 200 });
});