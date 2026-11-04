import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limiter";
import { withAuth, errorResponse } from "@/lib/api-utils";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { SECURITY_GUARDRAIL } from "@/lib/ai/prompts/shared";

// Runtime Node, bukan edge: rate limiter memakai setInterval().unref() yang
// tidak ada di runtime edge.
export const runtime = "nodejs";

/**
 * AI Polish API v2, Quick polish dengan CV context
 * Menerima context tambahan (jobTitle, skills, jobDescription) untuk hasil lebih relevan
 */

const POLISH_SYSTEM_PROMPT_V2 = `
${SECURITY_GUARDRAIL}

--- PERAN ---
Anda adalah AI Resume Polish Expert. Tugas Anda: MEMPERBAIKI teks CV agar lebih profesional, mudah dibaca sistem ATS, dan impactful, TANPA mengubah informasi faktual.

--- METODE ---
Gunakan pendekatan 3 langkah:
1. ANALISIS: Identifikasi action verb lemah, struktur kalimat kurang optimal, dan keyword yang bisa ditambahkan
2. OPTIMASI: Perkuat action verb, perbaiki struktur, tambahkan keyword natural dari target role
3. VALIDASI: Pastikan tidak ada informasi yang diubah maknanya, hanya memperbaiki cara penyampaian

--- ATURAN OPTIMASI ---
1. Ganti action verb lemah (helped, assisted, did, made) → stronger (developed, built, optimized, delivered)
2. Pakai angka/metrik HANYA yang sudah ada di input. Jika hasil terukur cocok tapi angkanya tidak ada, tulis placeholder [angka], [persen], atau [jumlah orang] supaya user mengisinya sendiri
3. Sisipkan keyword dari target role secara NATURAL (bukan keyword stuffing)
4. FORMAT: jika CV CONTEXT memuat "Format Output: bullets", kembalikan SATU POIN PER BARIS tanpa simbol bullet atau nomor di awal baris (tanpa "•", "-", "*", "1."). Jika "Format Output: paragraph" atau "Field Type" adalah ringkasan, kembalikan SATU PARAGRAF tanpa baris baru. Tanpa keduanya, pertahankan format input
5. Maksimal 2 baris per bullet point
6. JANGAN mengarang pencapaian yang tidak ada di input
7. JANGAN menambahkan informasi baru yang tidak tersirat dari input, cukup perbaiki cara penyampaian
8. JANGAN mengarang angka, perusahaan, tools, teknologi, atau sertifikasi yang tidak ada di input
9. JANGAN menyebut statistik tentang HR/perekrut dan JANGAN menjanjikan lolos ATS atau diterima kerja

--- BAHASA ---
- Deteksi bahasa input secara otomatis
- Output dalam bahasa yang SAMA dengan input, jangan campur (input Inggris → output Inggris, input Indonesia → output Indonesia)
- Gunakan PAST TENSE untuk role lama, PRESENT TENSE untuk role saat ini
- Pertahankan istilah teknis (React, CI/CD, API) apa adanya

--- OUTPUT CONSTRAINTS (WAJIB) ---
1. HANYA output teks yang sudah di-optimasi, TANPA penjelasan, TANPA intro, TANPA markdown
2. JANGAN output "Berikut adalah...", "Sesuai permintaan...", atau kalimat pembuka lainnya
3. JANGAN gunakan markdown code block
4. Output harus BERSIH, hanya teks hasil optimasi

--- CONTOH (bahasa output mengikuti bahasa input) ---
INPUT: "membantu tim coding fitur login untuk aplikasi e-commerce"
OUTPUT: "Mengembangkan fitur autentikasi pengguna untuk platform e-commerce bersama tim, untuk [jumlah orang] pengguna"

INPUT: "responsible for managing team of 5 developers"
OUTPUT: "Led a team of 5 developers in delivering application features on schedule"

INPUT: "handle customer complaints"
OUTPUT: "Resolved customer complaints through a structured escalation process, reducing average response time by [persen]"

INPUT: "made website for company"
OUTPUT: "Built the company website, increasing organic traffic by [persen]"
`;

// Batas body. Konteks (skills, jobDescription) hanya pelengkap prompt,
// jadi dibatasi ketat supaya biaya token tetap terkendali.
const PolishBodySchema = z.object({
  content: z.string().trim().min(1).max(5000),
  jobTitle: z.string().max(200).optional(),
  skills: z.array(z.string().max(100)).max(50).optional(),
  jobDescription: z.string().max(5000).optional(),
  field: z.string().max(100).optional(),
  format: z.enum(["bullets", "paragraph"]).optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await withAuth();
  if (authResult instanceof NextResponse) return authResult;

  // Tanpa kuota, tapi tetap dibatasi per akun karena memanggil model berbayar.
  const rl = checkRateLimit({
    key: `ai-polish:${authResult.userId}`,
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
  const parsed = PolishBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", "Teks kosong atau lebih dari 5.000 karakter. Periksa isinya lalu coba lagi.", 400);
  }

  try {
    const { content, jobTitle, skills, jobDescription, field, format } = parsed.data;

    // Bangun CV context untuk prompt
    let contextStr = "";
    if (jobTitle) contextStr += `Target Role: ${jobTitle}\n`;
    if (skills && skills.length > 0) contextStr += `Skills: ${skills.join(", ")}\n`;
    if (jobDescription) contextStr += `Job Description: ${jobDescription.slice(0, 500)}\n`;
    if (field) contextStr += `Field Type: ${field}\n`;
    if (format) contextStr += `Format Output: ${format}\n`;

    // Bangun user prompt
    let userPrompt = content;
    if (contextStr) {
      userPrompt = `--- CV CONTEXT ---
${contextStr}
--- TEKS YANG PERLU DIOPTIMASI ---
${content}
--- END ---
`;
    }

    // Panggil AI, text mode: output teks murni (bukan json_object)
    const polished = await callAI<string>({
      systemPrompt: POLISH_SYSTEM_PROMPT_V2,
      userPrompt,
      temperature: 0.4,
      maxTokens: 1024,
      model: MODELS.CHAT,
      maxRetries: 2,
      responseFormat: "text",
    });

    // Return response
    return NextResponse.json({
      success: true,
      polished: polished.trim(),
      original: content,
    });

  } catch (error) {
    console.error("AI Polish error:", error);
    return errorResponse("AI_FAILED", "Teks belum berhasil dipoles. Coba lagi sebentar lagi.", 500);
  }
}
