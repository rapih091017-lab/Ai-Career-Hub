import OpenAI from "openai";
import { ZodSchema, ZodError } from "zod";
import { SECURITY_GUARDRAIL } from "./prompts/shared";
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
}

/* ─── Model routing ─────────────────────────────────────── */
export const MODELS = {
  /** Analisis mendalam — reasoning model (deepseek-reasoner/R1) */
  REASONER: "deepseek-reasoner",
  /** General purpose — deepseek-chat (V3) */
  CHAT: "deepseek-chat",
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

/* ─── Inject input data into prompt ─────────────────────── */
/* ─── Strip lone surrogate characters that break JSON serialization ── */
function sanitizeText(text: string): string {
  return text.replace(/[\uD800-\uDFFF]/g, '');
}

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

/* ─── Parse & validate JSON + retry ─────────────────────── */
async function parseWithRetry<T>(
  raw: string,
  schema?: ZodSchema<T>,
  maxRetries: number = 0,
): Promise<{ data: T | null; error: string | null }> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const parsed = JSON.parse(raw) as T;

      if (schema) {
        const validated = schema.parse(parsed);
        return { data: validated, error: null };
      }

      return { data: parsed, error: null };
    } catch (err) {
      if (err instanceof ZodError) {
        lastError = `Validation error: ${err.issues.map((e: any) => e.message).join("; ")}`;
      } else if (err instanceof SyntaxError) {
        lastError = `JSON parse error: ${err.message}`;
        // Jika bukan attempt terakhir, kita coba lagi — tapi retry AI, bukan re-parse
        return { data: null, error: lastError };
      } else {
        lastError = `Unknown error: ${String(err)}`;
      }
      return { data: null, error: lastError };
    }
  }

  return { data: null, error: lastError };
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
}: CallAIParams): Promise<T> {
  // 1. Inject security guardrail ke system prompt
  const secureSystemPrompt = SECURITY_GUARDRAIL + "\n\n" + systemPrompt;

  // 2. Inject user context ke prompt
  const enrichedSystemPrompt = injectUserContext(secureSystemPrompt, userContext);

  // 3. Inject input data ke system prompt (placeholder {{CV_TEXT}}/{{JD_TEXT}} ada di system prompt)
  const systemPromptWithData = injectInputData(enrichedSystemPrompt, userPrompt);
  // 4. Sanitize user prompt — userPrompt berisi data aktual (CV/JD) yang mungkin mengandung
  //    karakter lone surrogate yang bikin DeepSeek API 400 error
  const enrichedUserPrompt = sanitizeText(userPrompt);

  // 4. Auto-select temperature & model by task type
  const finalTemp = temperature ?? TEMPERATURE_MAP[taskType ?? ""] ?? 0.7;
  const finalModel = model ?? MODEL_MAP[taskType ?? ""] ?? MODELS.CHAT;

  // 5. Panggil AI (with retry)
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: finalModel,
        temperature: finalTemp,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPromptWithData },
          { role: "user", content: enrichedUserPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0]?.message?.content ?? "{}";

      // 6. Validasi dengan Zod schema jika taskType diberikan
      const schema = taskType ? AI_SCHEMAS[taskType] : undefined;
      const { data, error } = await parseWithRetry<T>(raw, schema as ZodSchema<T> | undefined, maxRetries);

      if (data) return data;

      lastError = error;

      // Jika error parsing, retry — AI kadang return JSON tidak valid
      if (attempt < maxRetries - 1) {
        console.warn(`AI response parse error (attempt ${attempt + 1}/${maxRetries}): ${error}. Retrying...`);
        continue;
      }

      throw new Error(`AI response validation failed after ${maxRetries} attempts: ${error}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);

      if (attempt < maxRetries - 1) {
        console.warn(`AI call failed (attempt ${attempt + 1}/${maxRetries}): ${lastError}. Retrying...`);
        continue;
      }
    }
  }

  throw new Error(`AI call failed after ${maxRetries} attempts: ${lastError}`);
}

/* ─── Utility: build user context from partial data ─────── */
export function buildUserContext(opts: {
  jobTitle?: string | null;
  industry?: string;
  cvLang?: "id" | "en";
  experienceLevel?: "entry" | "mid" | "senior" | "lead";
}): UserContext | undefined {
  if (!opts.jobTitle && !opts.industry) return undefined;

  return {
    targetRole: opts.jobTitle ?? undefined,
    industry: opts.industry,
    experienceLevel: opts.experienceLevel,
    cvLang: opts.cvLang,
  };
}
