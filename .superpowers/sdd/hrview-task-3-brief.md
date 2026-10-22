# Brief Task 3

Sumber: `docs/superpowers/plans/2026-10-18-checker-hr-point-of-view.md` (bagian Task 3)

Semua nilai, nama file, dan cuplikan kode di bawah diambil langsung dari plan.
Jadikan isi brief ini acuan requirements; jangan mengarang nilai lain.

### Task 3: Bawa `meta` sampai ke layar, dan rapikan mapping hasil tersimpan

**Files:**
- Modify: `src/app/api/checker/analyze/route.ts:275-291` (objek `aiStructuredData`)
- Modify: `src/components/checker/types.ts:137-181` (`AnalysisResult`)
- Create: `src/lib/checker/analysis-from-full-result.ts`
- Modify: `src/app/checker/[id]/page.tsx:64-90`
- Test: `src/__tests__/checker-analysis-from-full-result.test.ts`

**Interfaces:**
- Consumes: `PROMPT_MARKERS` (Task 1) — tidak dipakai langsung
- Produces:
  - `AnalysisResult` mendapat tiga field baru opsional: `meta`, `careerVelocity`, `atsPredictionDetail`
  - `analysisFromFullResult(id: string, data: { scores?: unknown; aiFeedback?: unknown; fullResult?: unknown }): AnalysisResult`

**Konteks.** `aiStructuredData` tidak menyertakan `meta`, padahal `meta.detected_seniority` sudah dikembalikan AI dan dibutuhkan panel. `careerVelocity` dan `atsPredictionDetail` sebenarnya sudah dikirim, tapi `AnalysisResult` tidak mendeklarasikannya, dan halaman `/checker/[id]` memetakannya manual dengan `any` sehingga tiga field itu tidak pernah sampai ke layar.

Mapping dipindah ke fungsi murni supaya bisa diuji dan supaya kedua sumber hasil punya bentuk yang sama.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/__tests__/checker-analysis-from-full-result.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";

const FULL = {
  grade: "B",
  atsPrediction: "Likely Pass",
  meta: { detected_seniority: "entry", analysis_confidence: 78 },
  careerVelocity: { title_progression: "Upward", growth_rate: "Normal" },
  atsPredictionDetail: {
    result: "Likely Pass",
    risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" }],
    strengths: [{ text: "Ada metrik dampak", source_excerpt: "Bangun dashboard untuk 40 user" }],
  },
  breakdown: { summary: { score: 70 } },
};

describe("mapping hasil tersimpan ke bentuk hasil analisis", () => {
  it("membawa meta, careerVelocity, dan atsPredictionDetail", () => {
    const result = analysisFromFullResult("abc", {
      scores: { overall: 72 },
      aiFeedback: { summary: "Cukup baik" },
      fullResult: FULL,
    });
    expect(result.meta?.detected_seniority).toBe("entry");
    expect(result.careerVelocity?.title_progression).toBe("Upward");
    expect(result.atsPredictionDetail?.risk_factors).toHaveLength(1);
  });

  it("hasil lama tanpa meta tetap jadi hasil yang valid", () => {
    // Baris checker_results yang dibuat sebelum meta ada tidak punya field ini.
    const result = analysisFromFullResult("lama", {
      scores: { overall: 50 },
      aiFeedback: { summary: "" },
      fullResult: { grade: "C", breakdown: { summary: { score: 50 } } },
    });
    expect(result.meta).toBeNull();
    expect(result.careerVelocity).toBeNull();
    expect(result.atsPredictionDetail).toBeNull();
    expect(result.grade).toBe("C");
  });

  it("fullResult null tidak bikin error", () => {
    const result = analysisFromFullResult("kosong", { scores: {}, aiFeedback: {}, fullResult: null });
    expect(result.breakdown).toBeNull();
    expect(result.bulletReview).toEqual([]);
    expect(result.scores.overall).toBe(0);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot`
Expected: FAIL — modul `analysis-from-full-result` belum ada.

- [ ] **Step 3: Tambahkan tiga field ke `AnalysisResult`**

Di `src/components/checker/types.ts`, tambahkan sebelum penutup `AnalysisResult` (setelah `aiModel`):

```ts
  /** Konteks yang dikembalikan AI, dipakai panel sisi HR */
  meta?: {
    role_category?: string;
    detected_seniority?: "entry" | "mid" | "senior" | "lead";
    cv_word_count?: number;
    jd_present?: boolean;
    analysis_confidence?: number;
  } | null;
  /** Bacaanlintasan karier; belum ditampilkan sebelum panel sisi HR */
  careerVelocity?: {
    time_in_role_analysis?: string;
    title_progression?: "Strong Upward" | "Upward" | "Stable" | "Sideways" | "Declining";
    responsibility_arc?: string;
    growth_rate?: "Fast" | "Normal" | "Slow";
    red_flags?: string[];
    recommendations?: string[];
  } | null;
  /** Detail prediksi ATS: risk factor dan strength lengkap dengan kutipan CV */
  atsPredictionDetail?: {
    result?: "Likely Pass" | "Borderline" | "Likely Fail";
    match_confidence?: number;
    risk_factors?: {
      text: string;
      severity?: "critical" | "high" | "medium" | "low";
      source_excerpt?: string | null;
    }[];
    strengths?: (string | { text: string; source_excerpt?: string | null })[];
  } | null;
```

- [ ] **Step 4: Buat mapper murni**

Buat `src/lib/checker/analysis-from-full-result.ts`:

```ts
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
  const breakdown = (full.breakdown ?? null) as AnyRecord;

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
```

- [ ] **Step 5: Kirim `meta` dari route**

Di `src/app/api/checker/analyze/route.ts`, tambahkan satu baris di objek `aiStructuredData` (dekat `careerVelocity`):

```ts
    meta: aiAnalysis?.meta ?? null,
```

- [ ] **Step 6: Pakai mapper di halaman hasil tersimpan**

Di `src/app/checker/[id]/page.tsx`, ganti seluruh blok `setResult({...})` (sekitar baris 64-90) dengan:

```ts
        setResult(
          analysisFromFullResult(data.id, {
            scores: data.scores,
            aiFeedback: data.aiFeedback,
            fullResult: data.fullResult,
          }),
        );
```

Tambahkan import:

```ts
import { analysisFromFullResult } from "@/lib/checker/analysis-from-full-result";
```

- [ ] **Step 7: Jalankan test**

Run: `npx vitest run src/__tests__/checker-analysis-from-full-result.test.ts --reporter=dot`
Expected: PASS (3 test).

- [ ] **Step 8: Typecheck dan suite penuh**

Run: `npx tsc --noEmit -p tsconfig.json` — tidak ada output.
Run: `npx vitest run --reporter=dot` — semua hijau.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/checker/analyze/route.ts src/components/checker/types.ts src/lib/checker/analysis-from-full-result.ts "src/app/checker/[id]/page.tsx" src/__tests__/checker-analysis-from-full-result.test.ts
git commit -m "feat(checker): teruskan meta dan rapikan mapping hasil tersimpan

meta dibuang di aiStructuredData padahal detected_seniority di dalamnya
dipakai panel sisi HR. careerVelocity dan atsPredictionDetail sebenarnya
sudah dikirim tapi tidak dideklarasikan di AnalysisResult, dan halaman
/checker/[id] memetakannya manual dengan any sehingga ketiganya tidak
pernah sampai ke layar.

Mapping dipindah ke fungsi murni supaya bisa diuji dan kedua sumber hasil
punya bentuk yang sama. Baris lama tanpa meta jadi null, bukan error."
```

---

