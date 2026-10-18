import type { AnalysisResult } from "@/components/checker/types";

interface StoredResult {
  scores?: unknown;
  aiFeedback?: unknown;
  fullResult?: unknown;
}

type AnyRecord = Record<string, any>;

/**
 * Bentukkan AnalysisResult dari baris yang tersimpan di `checker_results`.
 *
 * Dipisah dari komponen supaya bisa diuji dan supaya hasil tersimpan punya
 * bentuk yang sama persis dengan hasil langsung. Field yang tidak ada pada
 * baris lama menjadi null, bukan error.
 */
export function analysisFromFullResult(id: string, data: StoredResult): AnalysisResult {
  const scores = (data.scores ?? {}) as AnyRecord;
  const feedback = (data.aiFeedback ?? {}) as AnyRecord;
  const full = (data.fullResult ?? {}) as AnyRecord;
  // Disimpan sebagai tipe breakdown AnalysisResult, bukan AnyRecord: kolom jsonb
  // tidak dijamin punya kelima section, tapi bentuk di layar tetap harus sama.
  const breakdown = (full.breakdown ?? null) as AnalysisResult["breakdown"];

  return {
    id,
    scores: {
      overall: scores.overall ?? 0,
      keywordGap: scores.keywordGap ?? 0,
      contextRelevance: scores.contextRelevance ?? 0,
      atsRules: scores.atsRules ?? 0,
    },
    aiFeedback: {
      keywordGap: feedback.keywordGap ?? "",
      contextRelevance: feedback.contextRelevance ?? "",
      atsRules: feedback.atsRules ?? "",
      summary: feedback.summary ?? "",
    },
    summary: feedback.summary ?? "",
    grade: full.grade ?? null,
    atsPrediction: full.atsPrediction ?? null,
    breakdown,
    keywordAnalysis: full.keywordAnalysis ?? null,
    narrativeFeedback: full.narrativeFeedback ?? null,
    actionPlan: full.actionPlan ?? null,
    bulletReview: full.bulletReview ?? [],
    missingSections: full.missingSections ?? [],
    impactForecast: full.impactForecast ?? null,
    meta: full.meta ?? null,
    careerVelocity: full.careerVelocity ?? null,
    atsPredictionDetail: full.atsPredictionDetail ?? null,
  };
}
