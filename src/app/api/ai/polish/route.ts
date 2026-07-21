import { NextRequest, NextResponse } from "next/server";
import { callAI, MODELS } from "@/lib/ai/adapter";
import { SECURITY_GUARDRAIL } from "@/lib/ai/prompts/shared";

export const runtime = "edge";

/**
 * AI Polish API v2 — Quick polish dengan CV context
 * Menerima context tambahan (jobTitle, skills, jobDescription) untuk hasil lebih relevan
 */

const POLISH_SYSTEM_PROMPT_V2 = `
${SECURITY_GUARDRAIL}

--- PERAN ---
Anda adalah AI Resume Polish Expert. Tugas Anda: MEMPERBAIKI teks CV agar lebih profesional, ATS-friendly, dan impactful — TANPA mengubah informasi faktual.

--- METODE ---
Gunakan pendekatan 3 langkah:
1. ANALISIS: Identifikasi action verb lemah, struktur kalimat kurang optimal, dan keyword yang bisa ditambahkan
2. OPTIMASI: Perkuat action verb, perbaiki struktur, tambahkan keyword natural dari target role
3. VALIDASI: Pastikan tidak ada informasi yang diarang — hanya memperbaiki cara penyampaian

--- ATURAN OPTIMASI ---
1. Ganti action verb lemah (helped, assisted, did, made) → stronger (developed, built, optimized, delivered)
2. Tambahkan metrik/angka jika relevan dan datanya tersedia [est.] jika tidak ada data pasti
3. Sisipkan keyword dari target role secara NATURAL (bukan keyword stuffing)
4. Pertahankan format input — jika bullet list, tetap bullet list
5. Maksimal 2 baris per bullet point
6. JANGAN mengarang pencapaian yang tidak ada di input
7. JANGAN menambahkan informasi baru yang tidak tersirat dari input

--- BAHASA ---
- Deteksi bahasa input secara otomatis
- Jika input Indonesia → output Indonesia yang profesional
- Jika input Inggris → output Inggris yang profesional
- Gunakan PAST TENSE untuk role lama, PRESENT TENSE untuk role saat ini

--- OUTPUT CONSTRAINTS (WAJIB) ---
1. HANYA output teks yang sudah di-optimasi — TANPA penjelasan, TANPA intro, TANPA markdown
2. JANGAN output "Berikut adalah...", "Sesuai permintaan...", atau kalimat pembuka lainnya
3. JANGAN gunakan code block (\\\`\\\`\\\`)
4. Output harus BERSIH — hanya teks hasil optimasi

--- CONTOH ---
INPUT: "membantu tim coding fitur login untuk aplikasi e-commerce"
OUTPUT: "Mengembangkan fitur autentikasi pengguna untuk platform e-commerce menggunakan React dan Node.js, memastikan keamanan login yang optimal"

INPUT: "responsible for managing team of 5 developers"
OUTPUT: "Memimpin tim 5 orang pengembang dalam pengembangan fitur aplikasi, meningkatkan produktivitas tim sebesar 30% melalui implementasi agile methodology"

INPUT: "handle customer complaints"
OUTPUT: "Menangani keluhan pelanggan dan menyelesaikan masalah dengan tingkat kepuasan 95%, mengurangi waktu respon dari 24 jam menjadi 2 jam"

INPUT: "made website for company"
OUTPUT: "Membangun website perusahaan menggunakan React dan TypeScript, meningkatkan performa loading sebesar 40% dan traffic organik sebesar 25%"
`;

interface PolishRequest {
  content: string;
  jobTitle?: string;
  skills?: string[];
  jobDescription?: string;
  field?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PolishRequest = await request.json();
    const { content, jobTitle, skills, jobDescription, field } = body;

    // Validasi input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 3000) {
      return NextResponse.json(
        { error: "Content too long. Maximum 3000 characters." },
        { status: 400 }
      );
    }

    // Bangun CV context untuk prompt
    let contextStr = "";
    if (jobTitle) contextStr += `Target Role: ${jobTitle}\n`;
    if (skills && skills.length > 0) contextStr += `Skills: ${skills.join(", ")}\n`;
    if (jobDescription) contextStr += `Job Description: ${jobDescription.slice(0, 500)}\n`;
    if (field) contextStr += `Field Type: ${field}\n`;

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

    // Panggil AI
    const polished = await callAI<string>({
      systemPrompt: POLISH_SYSTEM_PROMPT_V2,
      userPrompt,
      temperature: 0.4,
      maxTokens: 1024,
      model: MODELS.CHAT,
      maxRetries: 2,
    });

    // Return response
    return NextResponse.json({
      success: true,
      polished: polished.trim(),
      original: content,
    });

  } catch (error) {
    console.error("AI Polish error:", error);
    return NextResponse.json(
      { error: "Failed to polish content" },
      { status: 500 }
    );
  }
}
