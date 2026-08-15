import OpenAI from "openai";
import { ZodSchema, ZodError } from "zod";
import { AI_SCHEMAS, AiTaskType } from "./prompts/schemas";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1",
});

/* ─── Types ─────────────────────────────────────────────── */
export interface UserContext {
  /** Target role / posisi yang dilamar */
  targetRole?: string;
  /** Industri target */
  industry?: string;
  /** Tingkat pengalaman: entry / mid / senior / lead */
  experienceLevel?: "entry" | "mid" | "senior" | "lead";
  /** CV language (id/en) */
  cvLang?: "id" | "en";
}

interface CallAIParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  /** Task type for Zod validation. If provided, output is validated. */
  taskType?: AiTaskType;
  /** User context for injection */
  userContext?: UserContext;
  /** Max retries on failure. Default: 2 */
  maxRetries?: number;
  /**
   * Format output yang diharapkan.
   * - "json" (default): memaksa response_format json_object + validasi Zod.
   * - "text": mengembalikan teks mentah apa adanya (TANPA json_object, TANPA JSON.parse).
   *   Wajib dipakai untuk task yang outputnya teks murni (mis. AI Polish / Cover Letter).
   */
  responseFormat?: "json" | "text";
}

/* ─── Model routing ─────────────────────────────────────── */
/* DeepSeek menonaktifkan nama model lama (deepseek-chat & deepseek-reasoner)
 * sejak 24 Juli 2026. Penggantinya: deepseek-v4-flash (chat) & deepseek-v4-pro
 * (reasoning/thinking). Nama V4 sudah dipakai di seluruh fitur AI. */
export const MODELS = {
  /** Analisis mendalam — reasoning model (deepseek-v4-pro) */
  REASONER: "deepseek-v4-pro",
  /** General purpose — deepseek-v4-flash */
  CHAT: "deepseek-v4-flash",
} as const;

/** Recommended temperature per task type */
const TEMPERATURE_MAP: Record<string, number> = {
  analysis: 0.1, // Low temp = konsisten, presisi tinggi
  revision: 0.5, // Medium-low — butuh kreativitas terkontrol
  suggestion: 0.4, // Medium-low
  summary_suggestion: 0.5,
  portfolio: 0.75, // Higher — butuh kreativitas naratif
};

/** Recommended model per task type */
const MODEL_MAP: Record<string, string> = {
  analysis: MODELS.REASONER, // Analisis kompleks → reasoning model
  revision: MODELS.CHAT,
  suggestion: MODELS.CHAT,
  summary_suggestion: MODELS.CHAT,
  portfolio: MODELS.CHAT,
};

/* ─── Inject user context into prompt ───────────────────── */
function injectUserContext(prompt: string, ctx?: UserContext): string {
  if (!ctx) return prompt;

  const contextStr = `
--- USER CONTEXT ---
Posisi Target: ${ctx.targetRole || "(tidak disebutkan)"}
Industri: ${ctx.industry || "(tidak disebutkan)"}
Tingkat Pengalaman: ${ctx.experienceLevel || "(tidak disebutkan)"}
Bahasa CV: ${ctx.cvLang === "en" ? "English" : "Indonesia"}
--- END CONTEXT ---
  `.trim();

  return prompt.replace("{{USER_CONTEXT}}", contextStr);
}

/* ─── Strip lone surrogate characters that break JSON serialization ── */
function sanitizeText(text: string): string {
  return text.replace(/[\uD800-\uDFFF]/g, "");
}

/* ─── Inject input data into prompt ─────────────────────── */
function injectInputData(prompt: string, data: string): string {
  // Ekstrak CV dan JD dari data — pake indexOf biar toleran terhadap whitespace
  const JD_MARKER = "=== JOB DESCRIPTION ===";
  const jdIndex = data.indexOf(JD_MARKER);
  const cvText = sanitizeText(jdIndex === -1 ? data : data.slice(0, jdIndex).trim());
  const jdText = sanitizeText(jdIndex === -1 ? "" : data.slice(jdIndex + JD_MARKER.length).trim());

  return prompt
    .replace("{{INPUT_DATA}}", data)
    .replace("{{CV_TEXT}}", cvText)
    .replace("{{JD_TEXT}}", jdText)
    .replace("{{PROFILE_DATA}}", data);
}

/* ─── Parse & validate JSON (single pass) ───────────────── */
function parseAIResponse<T>(
  raw: string,
  schema?: ZodSchema<T>,
): { ok: true; data: T } | { ok: false; error: string } {
  try {
    // Buang markdown code fence (```json ... ```) + teks pengantar yang kadang
    // dibungkus model — terutama deepseek-v4-pro yang memakai thinking mode.
    // Potong ke bagian JSON saja (dari { pertama).
    let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }
    const parsed = JSON.parse(cleaned) as T;

    if (schema) {
      const validated = schema.parse(parsed);
      return { ok: true, data: validated };
    }

    return { ok: true, data: parsed };
  } catch (err) {
    if (err instanceof ZodError) {
      return { ok: false, error: `Validation error: ${err.issues.map((e) => e.message).join("; ")}` };
    }
    if (err instanceof SyntaxError) {
      return { ok: false, error: `JSON parse error: ${err.message}` };
    }
    return { ok: false, error: `Unknown error: ${String(err)}` };
  }
}

/* ─── MAIN: callAI ─────────────────────────────────────── */
export async function callAI<T = unknown>({
  systemPrompt,
  userPrompt,
  temperature,
  maxTokens = 4096,
  model,
  taskType,
  userContext,
  maxRetries = 2,
  responseFormat = "json",
}: CallAIParams): Promise<T> {
  // CATATAN: SECURITY_GUARDRAIL TIDAK lagi ditambahkan di sini karena SEMUA
  // system prompt yang dipakai aplikasi sudah menyisipkannya sendiri
  // (lihat src/lib/ai/prompts/shared.ts + tiap file prompt).
  // Jaga-jaga: beri peringatan keras di dev jika ada prompt baru yang lupa.
  if (!systemPrompt.includes("GUARDRAIL KEAMANAN")) {
    console.warn("[AI] systemPrompt tanpa SECURITY_GUARDRAIL — sisipkan dari src/lib/ai/prompts/shared.ts");
  }

  // Inject user context & input data ke system prompt
  const systemPromptWithData = injectInputData(
    injectUserContext(systemPrompt, userContext),
    userPrompt,
  );

  // Sanitize user prompt — userPrompt berisi data aktual (CV/JD) yang mungkin
  // mengandung karakter lone surrogate yang bikin DeepSeek API 400 error
  const enrichedUserPrompt = sanitizeText(userPrompt);

  const isTextMode = responseFormat === "text";
  const finalTemp = temperature ?? TEMPERATURE_MAP[taskType ?? ""] ?? 0.7;
  const finalModel = model ?? MODEL_MAP[taskType ?? ""] ?? MODELS.CHAT;
  const isReasoner = finalModel === MODELS.REASONER;
  const schema = taskType ? AI_SCHEMAS[taskType] : undefined;

  // deepseek-v4-pro memakai thinking mode dan TIDAK mendukung response_format
  // json_object (400 error). Tambahkan instruksi agar model mengembalikan
  // HANYA output akhir — reasoning berjalan internal.
  const effectiveSystemPrompt = isReasoner
    ? systemPromptWithData +
      "\n\n--- CATATAN MODEL ---\nAnda adalah model reasoning (deepseek-v4-pro). Lakukan seluruh analisis dan pemikiran secara INTERNAL — TANPA menampilkan langkah-langkah, TANPA blok <think>, TANPA penjelasan. Kembalikan HANYA output akhir yang valid sesuai skema yang diminta."
    : systemPromptWithData;

  // Petunjuk tambahan saat retry — meminta model mengembalikan JSON valid
  const retryInstruction =
    "\n\n⚠️ PERHATIAN: Respons AI sebelumnya TIDAK valid (bukan JSON valid / tidak sesuai skema)." +
    " Mohon kembalikan HANYA JSON yang valid sesuai SKEMA OUTPUT WAJIB yang diminta, tanpa teks lain.";

  const maxAttempts = maxRetries + 1; // 1 percobaan awal + N retry
  let lastError: string | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: finalModel,
        temperature: finalTemp,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: effectiveSystemPrompt },
          // Saat retry, perjelas ke model bahwa respons sebelumnya gagal diverifikasi
          { role: "user", content: attempt === 0 ? enrichedUserPrompt : enrichedUserPrompt + retryInstruction },
        ],
        // Text mode: TANPA response_format json_object (DeepSeek 400 jika dipaksa).
        // deepseek-v4-pro (thinking): json_object TIDAK didukung — JSON dipaksa via prompt.
        response_format: isTextMode || isReasoner ? undefined : { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content ?? "";

      if (isTextMode) {
        // Text mode — return teks mentah (tanpa JSON.parse); retry jika kosong
        const text = raw.trim();
        if (text) return text as T;
        lastError = "Empty text response";
      } else {
        // JSON mode — parse + validasi Zod
        const parsed = parseAIResponse<T>(raw, schema as ZodSchema<T> | undefined);
        if (parsed.ok) return parsed.data;
        lastError = parsed.error;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < maxAttempts - 1) {
      console.warn(`AI call attempt ${attempt + 1}/${maxAttempts} gagal (${lastError}). Mencoba ulang...`);
    }
  }

  throw new Error(`AI call failed after ${maxAttempts} attempts: ${lastError}`);
}

/* ─── Utility: build user context from partial data ─────── */
export function buildUserContext(opts: {
  jobTitle?: string | null;
  industry?: string;
  cvLang?: "id" | "en";
  experienceLevel?: "entry" | "mid" | "senior" | "lead";
}): UserContext | undefined {
  // cvLang ikut menentukan bahasa output prompt (mis. bullet revision),
  // jadi tetap kirim meskipun jobTitle/industry kosong.
  if (!opts.jobTitle && !opts.industry && !opts.cvLang) return undefined;

  return {
    targetRole: opts.jobTitle ?? undefined,
    industry: opts.industry,
    experienceLevel: opts.experienceLevel,
    cvLang: opts.cvLang,
  };
}
