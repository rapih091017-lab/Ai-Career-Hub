import { NextRequest, NextResponse } from "next/server";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { SECURITY_GUARDRAIL } from "@/lib/ai/prompts/shared";
import { z } from "zod";

export const runtime = "edge";

/**
 * AI Grammar Check API — Endpoint untuk memeriksa ejaan dan tanda baca pada CV
 * Mengembalikan structured JSON untuk inline error highlighting
 */

// Schema untuk validasi response grammar check
const GrammarErrorSchema = z.object({
  context: z.string(),
  text: z.string(),
  suggestion: z.string(),
  reason: z.string(),
  type: z.enum(["spelling", "punctuation"]),
  position: z.number().optional(),
});

const GrammarCheckResultSchema = z.object({
  errors: z.array(GrammarErrorSchema),
  totalErrors: z.number(),
  summary: z.string(),
});

// System prompt untuk Grammar Check
const GRAMMAR_CHECK_SYSTEM_PROMPT = `
${SECURITY_GUARDRAIL}

--- PERAN ---
Anda adalah Asisten Koreksi CV profesional. Tugas Anda HANYA menemukan:
1. ✅ Typo (salah ketik) — contoh: "sebgai" seharusnya "sebagai"
2. ✅ Error tanda baca serius — hanya yang duplikat (seperti ",," atau "..") atau posisi salah

--- STRICT DILARANG ---
1. ❌ DILARANG memberi saran gaya, nada, optimasi, atau rewrite
2. ❌ DILARANG report "tidak ada error" — jika bersih, array errors harus KOSONG
3. ❌ DILARANG over-correct istilah teknis kecuali sangat yakin itu typo
4. ❌ DILARANG melaporkan penggunaan campuran bahasa sebagai error — DIIZINKAN di CV teknologi
5. ❌ DILARANG melaporkan spasi antara karakter sebagai error

--- EXCEPTIONS (JANGAN REPORT) ---
- Campuran tanda baca Indonesia-Inggris → DIIZINKAN
- Spasi antara karakter → jangan report
- Singkatan teknologi (API, SDK, CSS, dll) → jangan report

--- FOKUS HANYA PADA ---
1. ✅ TYPO: Salah ketik yang jelas
2. ✅ TANDA BACA: Duplikat atau salah posisi

--- OUTPUT FORMAT (JSON) ---
{
  "errors": [
    {
      "context": "Kalimat lengkap yang mengandung error",
      "text": "Bagian yang error",
      "suggestion": "Perbaikan",
      "reason": "Deskripsi singkat error",
      "type": "spelling atau punctuation",
      "position": null
    }
  ],
  "totalErrors": jumlah_error,
  "summary": "Ringkasan singkat"
}

--- ATURAN OUTPUT ---
1. Kembalikan HANYA JSON yang valid — tanpa markdown, tanpa backticks
2. Jika tidak ada error, kembalikan { "errors": [], "totalErrors": 0, "summary": "Tidak ditemukan error" }
3. Pastikan "text" adalah potongan teks yang BENAR-BENAR ADA di input
4. "suggestion" harus berisi perbaikan yang lebih baik
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, language = "auto" } = body as {
      content: string;
      language?: "id" | "en" | "auto";
    };

    // Validasi input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: "Content is too long. Maximum 10000 characters." },
        { status: 400 }
      );
    }

    // Deteksi bahasa
    let detectedLanguage = language;
    if (language === "auto") {
      const hasIndonesian = /(?:saya|untuk|dengan|adalah|yang|ini|itu|pada|dari|kepada|dalam|oleh)/i.test(content);
      detectedLanguage = hasIndonesian ? "id" : "en";
    }

    // Panggil AI — tanpa taskType, kita handle validasi sendiri
    const aiResponse = await callAI<unknown>({
      systemPrompt: GRAMMAR_CHECK_SYSTEM_PROMPT,
      userPrompt: content,
      temperature: 0.1,
      maxTokens: 2048,
      model: MODELS.CHAT,
      maxRetries: 2,
    });

    // Validasi response dengan Zod schema
    const validationResult = GrammarCheckResultSchema.safeParse(aiResponse);

    if (!validationResult.success) {
      console.error("Grammar check validation error:", validationResult.error);
      return NextResponse.json({
        success: true,
        errors: [],
        totalErrors: 0,
        summary: "Tidak ditemukan error",
        language: detectedLanguage,
      });
    }

    const result = validationResult.data;

    return NextResponse.json({
      success: true,
      errors: result.errors,
      totalErrors: result.totalErrors,
      summary: result.summary,
      language: detectedLanguage,
    });

  } catch (error) {
    console.error("AI Grammar Check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check grammar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "AI Grammar Check API is running",
    endpoint: "/api/ai/grammar",
    method: "POST",
    body: {
      content: "string (required) - Teks CV yang ingin diperiksa",
      language: "id | en | auto (optional, default: auto)",
    },
  });
}
