import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { SECURITY_GUARDRAIL } from "@/lib/ai/prompts/shared";
import { z } from "zod";

// Runtime Node, bukan edge: rate limiter memakai setInterval().unref() yang
// tidak ada di runtime edge.
export const runtime = "nodejs";

/**
 * AI Grammar Check API, Endpoint untuk memeriksa ejaan dan tanda baca pada CV
 * Mengembalikan structured JSON untuk inline error highlighting
 */

// Schema untuk validasi response grammar check
// Semua field dibuat toleran dengan .catch() supaya satu field null/aneh
// tidak menggagalkan seluruh hasil, AI sering mengirim "position": null
const GrammarErrorSchema = z.object({
  context: z.string().catch(""),
  text: z.string().catch(""),
  suggestion: z.string().catch(""),
  reason: z.string().catch(""),
  type: z.enum(["spelling", "punctuation"]).catch("spelling"),
  position: z.number().nullable().optional().catch(null),
});

const GrammarCheckResultSchema = z.object({
  errors: z.array(GrammarErrorSchema).catch([]),
  totalErrors: z.number().catch(0),
  summary: z.string().catch(""),
});

// System prompt untuk Grammar Check
const GRAMMAR_CHECK_SYSTEM_PROMPT = `
${SECURITY_GUARDRAIL}

--- PERAN ---
Anda adalah Asisten Koreksi CV profesional. Tugas Anda HANYA menemukan:
1. ✅ Typo (salah ketik), contoh: "sebgai" seharusnya "sebagai"
2. ✅ Error tanda baca serius, hanya yang duplikat (seperti ",," atau "..") atau posisi salah

--- STRICT DILARANG ---
1. ❌ DILARANG memberi saran gaya, nada, optimasi, atau rewrite
2. ❌ DILARANG report "tidak ada error", jika bersih, array errors harus KOSONG
3. ❌ DILARANG over-correct istilah teknis kecuali sangat yakin itu typo
4. ❌ DILARANG melaporkan penggunaan campuran bahasa sebagai error, DIIZINKAN di CV teknologi
5. ❌ DILARANG melaporkan spasi antara karakter sebagai error

--- EXCEPTIONS (JANGAN REPORT) ---
- Campuran tanda baca Indonesia-Inggris → DIIZINKAN
- Spasi antara karakter → jangan report
- Singkatan teknologi (API, SDK, CSS, dll) → jangan report

--- FOKUS HANYA PADA ---
1. ✅ TYPO: Salah ketik yang jelas
2. ✅ TANDA BACA: Duplikat atau salah posisi

--- BAHASA ---
- Sesuaikan pemeriksaan dengan bahasa teks: teks Indonesia → periksa typo bahasa Indonesia; teks Inggris → periksa typo bahasa Inggris
- Jangan mengoreksi ejaan istilah teknis/campuran yang memang umum di CV teknologi

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
1. Kembalikan HANYA JSON yang valid, tanpa markdown, tanpa backticks
2. Jika tidak ada error, kembalikan { "errors": [], "totalErrors": 0, "summary": "Tidak ditemukan error" }
3. Pastikan "text" adalah potongan teks yang BENAR-BENAR ADA di input
4. "suggestion" harus berisi perbaikan yang lebih baik
5. "position" selalu null (posisi persis dihitung oleh aplikasi)

--- CONTOH OUTPUT BENAR ---
Input: "Saya berkuliah di Universitas Indonesia,, jurusan Ilmu Komputer"
Output: {"errors": [{"context": "Saya berkuliah di Universitas Indonesia,, jurusan Ilmu Komputer", "text": "Indonesia,,", "suggestion": "Indonesia,", "reason": "Tanda baca koma ganda", "type": "punctuation", "position": null}], "totalErrors": 1, "summary": "Ditemukan 1 error tanda baca."}

Input: "Saya mengembangkan aplikasi web menggunakan React dan Node.js, serta menangani testing end-to-end"
Output: {"errors": [], "totalErrors": 0, "summary": "Tidak ditemukan error"}
`;

const GrammarBodySchema = z.object({
  content: z.string().trim().min(1).max(10000),
  language: z.enum(["id", "en", "auto"]).optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await withAuth();
  if (authResult instanceof NextResponse) return authResult;

  // Tanpa kuota, tapi tetap dibatasi per akun karena memanggil model berbayar.
  const rl = checkRateLimit({
    key: `ai-grammar:${authResult.userId}`,
    maxRequests: 10,
    windowSeconds: 60,
  });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("INVALID_BODY", "Permintaan tidak bisa dibaca. Muat ulang halaman lalu coba lagi.", 400);
  }
  const parsed = GrammarBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", "Teks kosong atau lebih dari 10.000 karakter. Periksa isinya lalu coba lagi.", 400);
  }

  try {
    const { content, language = "auto" } = parsed.data;

    // Deteksi bahasa
    let detectedLanguage = language;
    if (language === "auto") {
      const hasIndonesian = /(?:saya|untuk|dengan|adalah|yang|ini|itu|pada|dari|kepada|dalam|oleh)/i.test(content);
      detectedLanguage = hasIndonesian ? "id" : "en";
    }

    // Panggil AI, tanpa taskType, kita handle validasi sendiri
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
    return errorResponse("AI_FAILED", "Pemeriksaan ejaan belum berhasil. Coba lagi sebentar lagi.", 500);
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
