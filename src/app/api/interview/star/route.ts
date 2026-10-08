import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiHandler, errorResponse, logUsage } from "@/lib/api-utils";
import { db } from "@/db";
import { masterProfiles, starScores } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { STAR_ANSWER_PROMPT } from "@/lib/ai/prompts/star-answer-v1";
import { STAR_EVALUATE_PROMPT } from "@/lib/ai/prompts/star-evaluate-v1";

/**
 * POST /api/interview/star
 * Menyusun jawaban STAR untuk satu pertanyaan interview. Bila user login dan
 * sudah punya profil, jawaban dipersonalisasi dari pengalaman nyata mereka;
 * tanpa profil, AI memakai placeholder dalam kurung siku. Tidak disimpan.
 */

const bodySchema = z.object({
  question: z.string().trim().min(5, "Pertanyaan terlalu pendek").max(500),
  category: z.string().trim().max(50).optional(),
  positionTitle: z.string().trim().max(120).optional(),
  /** Draft jawaban kandidat; bila dikirim (>= 40 karakter) mode evaluasi aktif. */
  userAnswer: z.string().trim().max(4000).optional(),
  /** ID pertanyaan (untuk menyimpan skor badge lintas perangkat). */
  questionId: z.string().trim().max(80).optional(),
});

const starSchema = z.object({
  situation: z.string().catch(""),
  task: z.string().catch(""),
  action: z.string().catch(""),
  result: z.string().catch(""),
  full: z.string().catch(""),
});

const scoreValue = z.coerce.number().min(0).max(5).catch(0);
const evaluateSchema = z.object({
  scores: z
    .object({
      situation: scoreValue,
      task: scoreValue,
      action: scoreValue,
      result: scoreValue,
    })
    .catch({ situation: 0, task: 0, action: 0, result: 0 }),
  feedback: z.string().catch(""),
  improved: z.string().catch(""),
});

/** GET /api/interview/star?questionId=: skor STAR terakhir user (untuk badge). */
export const GET = apiHandler(async (request: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const questionId = new URL(request.url).searchParams.get("questionId");
  if (!userId || !questionId) {
    return NextResponse.json({ score: null });
  }
  const [row] = await db
    .select()
    .from(starScores)
    .where(and(eq(starScores.userId, userId), eq(starScores.questionId, questionId)))
    .limit(1);
  return NextResponse.json({ score: row ? Number(row.score) : null });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Pertanyaan tidak valid", 400);
  }

  // ── Mode evaluasi: user mengirim draft jawabannya untuk dinilai STAR ──
  if (parsed.data.userAnswer && parsed.data.userAnswer.length >= 40) {
    try {
      const evalResult = await callAI<unknown>({
        systemPrompt: STAR_EVALUATE_PROMPT,
        userPrompt: `PERTANYAAN: ${parsed.data.question}\n\nJAWABAN KANDIDAT:\n${parsed.data.userAnswer}`,
        temperature: 0.2,
        model: MODELS.CHAT,
        maxTokens: 1200,
      });
      const evaluation = evaluateSchema.safeParse(evalResult);
      if (!evaluation.success) throw new Error("format evaluasi tidak sesuai");
      if (userId) await logUsage(userId, "interview_star_eval");

      // Simpan skor rata-rata untuk sinkron lintas perangkat (bila questionId dikirim).
      if (userId && parsed.data.questionId) {
        const average =
          (evaluation.data.scores.situation +
            evaluation.data.scores.task +
            evaluation.data.scores.action +
            evaluation.data.scores.result) /
          4;
        try {
          await db
            .insert(starScores)
            .values({ userId, questionId: parsed.data.questionId, score: average.toFixed(2) })
            .onConflictDoUpdate({
              target: [starScores.userId, starScores.questionId],
              set: { score: average.toFixed(2), updatedAt: new Date() },
            });
        } catch (saveErr) {
          console.error(
            "[interview/star] simpan skor gagal:",
            saveErr instanceof Error ? saveErr.message : saveErr,
          );
        }
      }
      return NextResponse.json({ evaluation: evaluation.data });
    } catch (err) {
      console.error("[interview/star] evaluasi gagal:", err instanceof Error ? err.message : err);
      return errorResponse(
        "AI_FAILED",
        "AI sedang tidak bisa menilai jawaban. Coba lagi sebentar lagi.",
        502,
      );
    }
  }

  // Personalisasi dari profil (jika ada): ringkas pengalaman + skill teratas.
  let profileSummary = "";
  if (userId) {
    const [profile] = await db
      .select()
      .from(masterProfiles)
      .where(eq(masterProfiles.userId, userId))
      .limit(1);
    if (profile) {
      const personalInfo = (profile.personalInfo ?? {}) as Record<string, unknown>;
      const works = (profile.workHistory ?? []) as Array<Record<string, unknown>>;
      const skills = (profile.skills ?? []) as Array<Record<string, unknown>>;
      profileSummary = [
        typeof personalInfo.summary === "string" && personalInfo.summary
          ? `Ringkasan: ${personalInfo.summary}`
          : "",
        works
          .slice(0, 3)
          .map(
            (work) =>
              `${String(work.position ?? "")} di ${String(work.company ?? "")}: ${String(work.description ?? "").slice(0, 200)}`,
          )
          .join("\n"),
        skills
          .slice(0, 12)
          .map((skill) => String(skill.name ?? ""))
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const userPrompt = [
    `PERTANYAAN: ${parsed.data.question}`,
    parsed.data.positionTitle ? `POSISI DILAMAR: ${parsed.data.positionTitle}` : "",
    profileSummary
      ? `DATA KANDIDAT (gunakan hanya fakta ini, jangan mengarang di luar ini):\n${profileSummary}`
      : "DATA KANDIDAT: belum tersedia. Gunakan placeholder dalam kurung siku.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await callAI<unknown>({
      systemPrompt: STAR_ANSWER_PROMPT,
      userPrompt,
      temperature: 0.4,
      model: MODELS.CHAT,
      maxTokens: 1200,
    });

    const star = starSchema.safeParse(result);
    if (!star.success || (!star.data.situation && !star.data.full)) {
      throw new Error("hasil AI tidak sesuai format");
    }

    if (userId) await logUsage(userId, "interview_star");
    return NextResponse.json({ star: star.data });
  } catch (err) {
    console.error("[interview/star] gagal:", err instanceof Error ? err.message : err);
    return errorResponse(
      "AI_FAILED",
      "AI sedang tidak bisa menyusun jawaban. Coba lagi sebentar lagi.",
      502,
    );
  }
});