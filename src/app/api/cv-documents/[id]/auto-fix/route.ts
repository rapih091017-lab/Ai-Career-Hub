import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cvDocuments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { callAI, MODELS, buildUserContext } from "@/lib/ai/adapter";
import { reserveQuota, type QuotaReservation } from "@/lib/api-utils";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { AUTO_FIX_PROMPT_V1 } from "@/lib/ai/prompts/auto-fix-v1";
import { parseAutoFixSuggestions, parseAutoFixRequest } from "@/lib/auto-fix";
import { resolveOutputLang, withOutputLang } from "@/lib/ai/output-lang";

/**
 * POST /api/cv-documents/[id]/auto-fix
 *
 * Memeriksa draf CV lalu mengembalikan daftar saran perbaikan
 * (bahasa, bullet, kata kunci). Endpoint ini HANYA membaca dan
 * mengusulkan — tidak ada perubahan yang disimpan. Penerapan terjadi
 * di client setelah user menyetujui tiap saran satu per satu.
 *
 * Body: { cv?: {...}, jobDescription?: string, outputLang?: "id" | "en" }
 * Respons: { suggestions: AutoFixSuggestion[] }
 */
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "lead"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let reservation: QuotaReservation | null = null;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "Anda harus login" },
        { status: 401 }
      );
    }

    // ── 0. RATE LIMIT ─────────────────────────────────────────────
    const rl = checkRateLimit({
      key: `auto-fix:${session.user.id}`,
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rl.allowed) {
      return rateLimitResponse(rl.resetInSeconds);
    }

    const { id } = await params;

    // CV harus milik user yang login.
    const [cvDoc] = await db
      .select()
      .from(cvDocuments)
      .where(and(eq(cvDocuments.id, id), eq(cvDocuments.userId, session.user.id)))
      .limit(1);

    if (!cvDoc) {
      return NextResponse.json(
        { error: "CV_NOT_FOUND", message: "CV tidak ditemukan" },
        { status: 404 }
      );
    }

    // ── 2. AMBIL DRAF CV ─────────────────────────────────────────
    // Draf terbaru dari client dipakai (state Review bisa belum tersimpan),
    // tapi hanya lewat skema berbatas; tanpa draf, pakai data di DB milik
    // user ini.
    const body = parseAutoFixRequest(await request.text());
    if (!body) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Data CV tidak valid atau terlalu besar." },
        { status: 400 }
      );
    }
    const stored = (cvDoc.tailoredContent ?? {}) as Record<string, unknown>;
    const cv = (body.cv ?? stored) as {
      summary?: unknown;
      workHistory?: unknown;
      skills?: unknown;
      cvLang?: unknown;
      experienceLevel?: string | null;
    };
    const jobDescription =
      typeof body.jobDescription === "string"
        ? body.jobDescription
        : cvDoc.jobDescription ?? "";

    const summary = typeof cv?.summary === "string" ? cv.summary : "";
    const workHistory = Array.isArray(cv?.workHistory) ? cv.workHistory : [];
    const skills = Array.isArray(cv?.skills)
      ? cv.skills.map((s: { name?: string }) => s?.name).filter(Boolean)
      : [];
    // Bahasa hasil: pilihan user → bahasa CV → bahasa ringkasan → id.
    const cvLang = resolveOutputLang({ requested: body.outputLang, cvLang: cv?.cvLang, text: summary });

    if (!summary && workHistory.length === 0) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "CV masih kosong. Isi ringkasan atau pengalaman dulu sebelum dicek." },
        { status: 400 }
      );
    }

    const userCtx = buildUserContext({
      jobTitle: cvDoc.jobTitle || "",
      industry: undefined,
      cvLang,
      experienceLevel: EXPERIENCE_LEVELS.find((l) => l === cv?.experienceLevel),
    });

    // ── 1. KUOTA (jatah AI Suggestion) ──────────────────────────
    // Kuota seumur akun (sengaja, menekan biaya AI), dicek & dicatat atomik; gagal → refund di catch.
    const reserved = await reserveQuota(session.user.id, "ai_suggestion", id, { period: "lifetime" });
    if (reserved instanceof NextResponse) return reserved;
    reservation = reserved;

    // ── 3. PANGGIL AI ────────────────────────────────────────────
    const userPrompt = JSON.stringify({
      summary,
      workHistory: workHistory.map((w: { position?: string; company?: string; description?: string }) => ({
        position: w.position || "",
        company: w.company || "",
        description: w.description || "",
      })),
      skills,
      jobTitle: cvDoc.jobTitle || "",
      jobDescription,
    });

    const aiResult = await callAI({
      systemPrompt: withOutputLang(AUTO_FIX_PROMPT_V1, cvLang),
      userPrompt,
      temperature: 0.4,
      model: MODELS.CHAT,
      userContext: userCtx,
    });

    // Validasi manual: saran yang tidak valid dibuang, bukan diganti default.
    const suggestions = parseAutoFixSuggestions(aiResult).slice(0, 10);

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    await reservation?.refund();
    console.error("AutoFix Error:", error);
    return NextResponse.json(
      { error: "AI_SERVICE_ERROR", message: "Layanan AI sedang gangguan. Silakan coba lagi beberapa saat." },
      { status: 500 }
    );
  }
}
