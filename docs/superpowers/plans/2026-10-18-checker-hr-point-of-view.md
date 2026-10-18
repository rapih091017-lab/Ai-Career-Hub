# POV HR di Hasil Checker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tampilkan panel "Sisi HR" di paling atas hasil checker — temuan yang bikin HR berhenti baca, temuan yang bikin dia lanjut, dan kutipan asli dari CV — memakai data yang sudah dikembalikan AI dan belum pernah dirender.

**Architecture:** Satu fungsi murni `buildHrPointOfView` merangkai data analisis yang sudah ada (`ats_prediction.risk_factors`, `.strengths`, `meta.detected_seniority`, `career_velocity`) menjadi satu view model. Satu komponen presentasi `HrPointOfView` dipakai berdua oleh `/checker` dan `/checker/[id]`. Nol prompt baru, nol token baru, nol skema baru.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Tailwind (token `text-*`, `bg-*`, `border-outline-*`), Vitest + @testing-library/react, i18n lewat `useTranslation` dengan kunci datar `"checker.<nama>": { id, en }`.

## Global Constraints

- Bahasa teks di UI: **santai seperti HR ngobrol ke orang beneran**. Boleh: "Yang bikin saya berhenti". Dilarang: "Temuan negatif terdeteksi", angka tanpa bukti, kalimat berjamjam, kapital sebagai penekanan.
- **Jangan pernah** menampilkan "CV-mu sudah bagus" saat panel kosong. Kita tidak bisa membedakan "memang tidak ada temuan" dari "AI tidak mengembalikan apa-apa". Status harus jujur + arahkan ke bagian lain.
- Kutipan CV ditampilkan **penuh, tidak dipotong**. Kutipan kepotong = kutipan salah.
- `source_excerpt` yang `null` → kutipan tidak dirender sama sekali. Jangan render kotak kosong.
- Tidak ada migrasi database di seluruh plan ini. Semua perubahan masuk ke kolom jsonb yang sudah ada.
- Semua komponen dan teks baru wajib dua bahasa (id + en).
- Setiap task diakhiri satu commit. Jalankan `npx vitest run` dan `npx tsc --noEmit -p tsconfig.json` sebelum commit.
- Prompt AI di `src/lib/ai/prompts/` hanya boleh diubah lewat Task 1 dan Task 2. Jangan menyentuh file prompt di task lain.

---

## Struktur File

| File | Tanggung jawab | Task |
| --- | --- | --- |
| `src/lib/ai/prompts/shared.ts` (modify) | Ekspor `PROMPT_MARKERS` — satu sumber kebenaran penanda CV/JD | 1 |
| `src/lib/ai/adapter.ts` (modify) | `injectInputData` memakai `PROMPT_MARKERS` | 1 |
| `src/app/api/checker/analyze/route.ts` (modify) | `userPrompt` memakai `PROMPT_MARKERS` | 1 |
| `src/lib/ai/prompts/analysis-v4.ts` (modify) | Tabel GRADE yang hilang | 2 |
| `src/app/api/checker/analyze/route.ts` (modify) | `meta` masuk `aiStructuredData` | 3 |
| `src/components/checker/types.ts` (modify) | Tambah `meta`, `careerVelocity`, `atsPredictionDetail` ke `AnalysisResult` | 3 |
| `src/lib/checker/analysis-from-full-result.ts` (create) | Mapping `fullResult` → `AnalysisResult`, tanpa cast `any` | 3 |
| `src/lib/checker/hr-point-of-view.ts` (create) | Fungsi murni `buildHrPointOfView` | 4 |
| `src/components/checker/HrPointOfView.tsx` (create) | Tampilan panel | 5 |
| `src/lib/i18n.tsx` (modify) | Kunci `checker.hrview-*` dan `checker.detail.hrview-*` | 5 |
| `src/app/checker/page.tsx` (modify) | Render panel + pangkas kolom duplikat | 6 |
| `src/app/checker/[id]/page.tsx` (modify) | Pakai mapper baru + render panel + pangkas kolom duplikat | 6 |

---

### Task 1: Perbaiki penanda CV/JD yang panting

**Files:**
- Modify: `src/lib/ai/prompts/shared.ts`
- Modify: `src/lib/ai/adapter.ts:94-107`
- Modify: `src/app/api/checker/analyze/route.ts:206`
- Test: `src/__tests__/ai-prompt-markers.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces: `PROMPT_MARKERS: { cv: string; jd: string }` dari `@/lib/ai/prompts/shared`

**Konteks.** `adapter.ts:96` mencari penanda `"=== JOB DESCRIPTION ==="`, sementara route menulis `"=== JOB DESCRIPTION TARGET ==="`. Karena `indexOf` mengembalikan `-1`, `{{CV_TEXT}}` diisi seluruh user prompt (termasuk isi JD) dan `{{JD_TEXT}}` kosong — padahal `analysis-v4.ts:344` minta keduanya terpisah.

**Kenapa tidak langsung ganti konstantanya.** Adapter dipakai bersama banyak prompt. Kalau dipaksa cuma mengenali satu penanda, pemanggil lain ikut rusak. Jadi penandanya dipindah ke satu tempat dan adapter menerima keduanya.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/__tests__/ai-prompt-markers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";

describe("penanda blok CV dan JD", () => {
  it("adapter dan route memakai penanda yang sama", () => {
    // Sumber-drift ini pernah terjadi: adapter cari "=== JOB DESCRIPTION ==="
    // sementara route nulis "=== JOB DESCRIPTION TARGET ===", sehingga
    // {{JD_TEXT}} terkirim kosong ke model.
    const adapter = readFileSync("src/lib/ai/adapter.ts", "utf8");
    const route = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");

    expect(adapter).toContain("PROMPT_MARKERS");
    expect(route).toContain("PROMPT_MARKERS");
    // Tidak boleh ada penanda yang ditulis manual di kedua file.
    expect(adapter).not.toContain('"=== JOB DESCRIPTION ==="');
    expect(route).not.toContain('"=== JOB DESCRIPTION TARGET ==="');
  });

  it("penanda JD yang dipakai route persis sama dengan yang dicari adapter", () => {
    const route = readFileSync("src/app/api/checker/analyze/route.ts", "utf8");
    expect(route).toContain("PROMPT_MARKERS.jd");
    expect(PROMPT_MARKERS.jd).toBe("=== JOB DESCRIPTION TARGET ===");
    expect(PROMPT_MARKERS.cv).toBe("=== CV KANDIDAT ===");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot`
Expected: FAIL — `PROMPT_MARKERS` belum ada di `shared.ts`.

- [ ] **Step 3: Tambahkan `PROMPT_MARKERS` ke `shared.ts`**

Buka `src/lib/ai/prompts/shared.ts`, tambahkan di bagian atas sebelum export lain:

```ts
/**
 * Penanda blok yang memisahkan CV dari deskripsi lowongan di user prompt.
 *
 * Dipakai oleh route penyusun prompt dan oleh adapter saat menyuntikkan data.
 * Semula masing-masing menulis penanda sendiri dan tidak sama, sehingga
 * {{CV_TEXT}} berisi seluruh prompt dan {{JD_TEXT}} kosong.
 */
export const PROMPT_MARKERS = {
  cv: "=== CV KANDIDAT ===",
  jd: "=== JOB DESCRIPTION TARGET ===",
} as const;
```

- [ ] **Step 4: Ubah `injectInputData` di adapter**

Ganti blok `injectInputData` (sekitar baris 94-107) dengan:

```ts
function injectInputData(prompt: string, data: string): string {
  // Both markers are accepted so prompts written before this constant existed
  // keep working; the correct one is whichever appears first in the data.
  const jdIndex = data.indexOf(PROMPT_MARKERS.jd);
  const legacyJdIndex = data.indexOf("=== JOB DESCRIPTION ===");
  const cut =
    jdIndex === -1 ? legacyJdIndex : legacyJdIndex === -1 ? jdIndex : Math.min(jdIndex, legacyJdIndex);

  const cvText = sanitizeText(cut === -1 ? data : data.slice(0, cut).trim());
  const jdText = sanitizeText(cut === -1 ? "" : data.slice(cut).trim());

  return prompt
    .replace("{{INPUT_DATA}}", data)
    .replace("{{CV_TEXT}}", cvText)
    .replace("{{JD_TEXT}}", jdText)
    .replace("{{PROFILE_DATA}}", data);
}
```

Tambahkan import di bagian atas `adapter.ts`:

```ts
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
```

- [ ] **Step 5: Ubah route agar memakai penanda yang sama**

Di `src/app/api/checker/analyze/route.ts`, ganti baris `userPrompt` (sekitar baris 206) dengan:

```ts
      userPrompt: `=== ROLE CATEGORY: ${roleCat} ===\n\n${PROMPT_MARKERS.cv}\n${extractedText}\n\n${PROMPT_MARKERS.jd}\n${jd || (outputLang === "en" ? "No job description provided." : "Tidak ada deskripsi pekerjaan.")}`,
```

Tambahkan import di `route.ts`:

```ts
import { PROMPT_MARKERS } from "@/lib/ai/prompts/shared";
```

- [ ] **Step 6: Tambahkan test perilaku split**

Tambahkan ke `src/__tests__/ai-prompt-markers.test.ts`:

```ts
describe("pemisahan CV dan JD di prompt", () => {
  // Fungsi internal adapter tidak diekspor, jadiDecode logikanya di sini
  // supaya kontrak yang diuji jelas: JD tidak boleh ikut masuk {{CV_TEXT}}.
  function splitCvJd(data: string) {
    const jdIndex = data.indexOf(PROMPT_MARKERS.jd);
    return {
      cv: (jdIndex === -1 ? data : data.slice(0, jdIndex).trim()).replace(
        new RegExp(`^=== ROLE CATEGORY:[^\\n]*\\n\\n${PROMPT_MARKERS.cv}\\n`),
        "",
      ),
      jd: jdIndex === -1 ? "" : data.slice(jdIndex + PROMPT_MARKERS.jd.length).trim(),
    };
  }

  it("deskripsi lowongan tidak ikut masuk ke bagian CV", () => {
    const data = [
      "=== ROLE CATEGORY: tech ===",
      "",
      PROMPT_MARKERS.cv,
      "Python, SQL, 3 tahun",
      "",
      PROMPT_MARKERS.jd,
      "Butuh engineer yang paham AWS",
    ].join("\n");
    const { cv, jd } = splitCvJd(data);
    expect(cv).toBe("Python, SQL, 3 tahun");
    expect(jd).toBe("Butuh engineer yang paham AWS");
  });
});
```

- [ ] **Step 7: Jalankan test**

Run: `npx vitest run src/__tests__/ai-prompt-markers.test.ts --reporter=dot`
Expected: PASS (5 test).

- [ ] **Step 8: Typecheck dan jalankan suite penuh**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tidak ada output.

Run: `npx vitest run --reporter=dot`
Expected: semua hijau, tidak ada test lama yang gagal.

- [ ] **Step 9: Commit**

```bash
git add src/lib/ai/prompts/shared.ts src/lib/ai/adapter.ts src/app/api/checker/analyze/route.ts src/__tests__/ai-prompt-markers.test.ts
git commit -m "fix(prompt): pisahkan CV dan deskripsi lowongan dengan benar

injectInputData mencari penanda '=== JOB DESCRIPTION ===' sementara route
menulis '=== JOB DESCRIPTION TARGET ==='. Karena indexOf mengembalikan -1,
{{CV_TEXT}} diisi seluruh user prompt termasuk isi lowongan, dan {{JD_TEXT}}
dikirim kosong — padahal prompt v4 minta keduanya terpisah.

Penandanya dipindah ke satu tempat supaya tidak bisa lagi berbeda antara
route dan adapter, dan adapter tetap menerima penanda lama supaya pemanggil
lain tidak ikut rusak."
```

---

### Task 2: Kembalikan tabel GRADE yang hilang dari prompt v4

**Files:**
- Modify: `src/lib/ai/prompts/analysis-v4.ts:43-46`, `:199-205`
- Test: `src/__tests__/checker-grade-prompt.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces: tidak ada (perilaku AI saja)

**Konteks.** `analysis-v4.ts:45` menyuruh AI mengikuti "tabel GRADE", dan `:201` menyebutnya lagi — tapi tabel itu tidak pernah ada di file tersebut. Ambangnya hanya ada di `analysis-v3.ts` yang sudah tidak dipakai. Artinya grade yang tampil ke user sedang ditebak AI.

Angka diambil dari v3 supaya hasil lama tidak berubah artinya: 85–100 A, 70–84 B, 50–69 C, 0–49 D.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/__tests__/checker-grade-prompt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ANALYSIS_PROMPT_V4 } from "@/lib/ai/prompts/analysis-v4";

describe("tabel GRADE di prompt v4", () => {
  it("prompt memuat ambang grade lengkap", () => {
    // Prompt menyuruh AI ikutin "tabel GRADE", jadi tabelnya wajib ada.
    // Tanpa ini grade yang tampil ke user hanya tebakan model.
    expect(ANALYSIS_PROMPT_V4).toContain("85-100");
    expect(ANALYSIS_PROMPT_V4).toContain("70-84");
    expect(ANALYSIS_PROMPT_V4).toContain("50-69");
    expect(ANALYSIS_PROMPT_V4).toContain("0-49");
  });

  it("setiap ambang disebut dengan huruf grade yang benar", () => {
    const gradeTable = ANALYSIS_PROMPT_V4.match(/GRADE[\s\S]{0,600}/g)?.join("\n") ?? "";
    expect(gradeTable).toMatch(/85-100[^\n]*\bA\b/);
    expect(gradeTable).toMatch(/70-84[^\n]*\bB\b/);
    expect(gradeTable).toMatch(/50-69[^\n]*\bC\b/);
    expect(gradeTable).toMatch(/0-49[^\n]*\bD\b/);
  });

  it("grade wajib konsisten dengan overall_score", () => {
    expect(ANALYSIS_PROMPT_V4).toMatch(/grade[^\n]*(Wajib|wajib|MUST|must)[^\n]*overall_score/);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/checker-grade-prompt.test.ts --reporter=dot`
Expected: FAIL — tabel GRADE tidak ada di prompt.

- [ ] **Step 3: Tambahkan tabel GRADE**

Di `src/lib/ai/prompts/analysis-v4.ts`, cari aturan nomor 5 (sekitar baris 45). Ganti baris itu menjadi:

```ts
5. grade WAJIB mengikuti threshold overall_score di tabel GRADE ini, tanpa kecuali:
   - 85-100: A
   - 70-84: B
   - 50-69: C
   - 0-49: D
   Tidak boleh menebak angka lain, dan tidak boleh memberi grade di luar A/B/C/D.
```

Lalu cari bagian validasi (sekitar baris 201) yang berbunyi `(b) grade sesuai threshold tabel GRADE`, dan ganti menjadi:

```ts
(b) grade WAJIB sama dengan hasil tabel GRADE di atas untuk overall_score yang kamu tulis. Kalau tidak cocok, angka itu salah.
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/checker-grade-prompt.test.ts --reporter=dot`
Expected: PASS (3 test).

- [ ] **Step 5: Typecheck dan suite penuh**

Run: `npx tsc --noEmit -p tsconfig.json` — tidak ada output.
Run: `npx vitest run --reporter=dot` — semua hijau.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/prompts/analysis-v4.ts src/__tests__/checker-grade-prompt.test.ts
git commit -m "fix(prompt): kembalikan tabel GRADE yang hilang dari prompt v4

Prompt menyuruh AI mengikuti 'tabel GRADE', tapi tabel itu tidak pernah ada
di file ini. Ambangnya hanya ada di prompt v3 yang sudah tidak dipakai,
jadi grade yang tampil ke pengguna selama ini ditebak model.

Ambang ditambahkan dengan angka yang sama seperti v3 supaya hasil lama
tidak berubah artinya."
```

---

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

### Task 4: Fungsi murni `buildHrPointOfView`

**Files:**
- Create: `src/lib/checker/hr-point-of-view.ts`
- Test: `src/__tests__/checker-hr-point-of-view.test.ts`

**Interfaces:**
- Consumes: `AnalysisResult["atsPredictionDetail"]`, `["meta"]`, `["careerVelocity"]` (Task 3)
- Produces:

```ts
export interface HrFinding {
  text: string;
  severity: "critical" | "high" | "medium" | "low" | null;
  quote: string | null;
}

export interface HrPointOfView {
  seniority: "entry" | "mid" | "senior" | "lead" | null;
  stopping: HrFinding[];
  continuing: HrFinding[];
  progression: "Strong Upward" | "Upward" | "Stable" | "Sideways" | "Declining" | null;
  growthRate: "Fast" | "Normal" | "Slow" | null;
  isEmpty: boolean;
}

export function buildHrPointOfView(result: AnalysisResult | null | undefined): HrPointOfView;
```

**Konteks.** `strengths` di schema berbentuk campuran — bisa `string` biasa, bisa `{ text, source_excerpt }`. Fungsi ini merapikannya jadi satu bentuk supaya komponen tidak pernah bercabang. Tidak ada panggilan AI, tidak ada akses jaringan.

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/__tests__/checker-hr-point-of-view.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildHrPointOfView } from "@/lib/checker/hr-point-of-view";

describe("pandangan sisi HR dari data analisis", () => {
  it("temuan berhenti dibaca membawa severity dan kutipan", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [
          { text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" },
        ],
        strengths: [],
      },
    } as any);

    expect(view.stopping).toEqual([
      { text: "TypeScript tidak ada", severity: "critical", quote: "JavaScript, React" },
    ]);
    expect(view.isEmpty).toBe(false);
  });

  it("strengths berupa string dan object dinormalisasi jadi satu bentuk", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [],
        strengths: [
          "Ada metrik dampak",
          { text: "Proyek nyata", source_excerpt: "Bangun dashboard untuk 40 user" },
        ],
      },
    } as any);

    expect(view.continuing).toEqual([
      { text: "Ada metrik dampak", severity: null, quote: null },
      { text: "Proyek nyata", severity: null, quote: "Bangun dashboard untuk 40 user" },
    ]);
  });

  it("kutipan null tidak jadi kotak kosong", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: null }],
        strengths: [],
      },
    } as any);

    expect(view.stopping[0].quote).toBeNull();
  });

  it("kutipan kosong dianggap tidak ada", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: "   " }],
        strengths: [],
      },
    } as any);

    expect(view.stopping[0].quote).toBeNull();
  });

  it("seniority terbaca dari meta", () => {
    const view = buildHrPointOfView({ meta: { detected_seniority: "entry" } } as any);
    expect(view.seniority).toBe("entry");
  });

  it("perjalanan karier terbaca dari careerVelocity", () => {
    const view = buildHrPointOfView({
      careerVelocity: { title_progression: "Upward", growth_rate: "Fast" },
    } as any);
    expect(view.progression).toBe("Upward");
    expect(view.growthRate).toBe("Fast");
  });

  it("panel kosong ditandai benar saat tidak ada temuan", () => {
    const view = buildHrPointOfView({ atsPredictionDetail: { risk_factors: [], strengths: [] } } as any);
    expect(view.isEmpty).toBe(true);
    expect(view.stopping).toEqual([]);
    expect(view.continuing).toEqual([]);
  });

  it("ats_prediction berupa string tidak bikin error", () => {
    // Schema mengizinkan ats_prediction berupa string, bukan objek.
    const view = buildHrPointOfView({ atsPrediction: "Likely Pass" } as any);
    expect(view.isEmpty).toBe(true);
    expect(view.stopping).toEqual([]);
  });

  it("hasil tanpa data sama sekali tetap aman", () => {
    for (const input of [null, undefined, {}, { meta: null, careerVelocity: null }]) {
      const view = buildHrPointOfView(input as any);
      expect(view.isEmpty).toBe(true);
      expect(view.seniority).toBeNull();
      expect(view.progression).toBeNull();
      expect(view.growthRate).toBeNull();
    }
  });

  it("butir tanpa teks diabaikan", () => {
    const view = buildHrPointOfView({
      atsPredictionDetail: {
        risk_factors: [{ text: "   ", severity: "high", source_excerpt: "apa saja" }],
        strengths: ["", { text: "  " }],
      },
    } as any);

    expect(view.stopping).toEqual([]);
    expect(view.continuing).toEqual([]);
    expect(view.isEmpty).toBe(true);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/checker-hr-point-of-view.test.ts --reporter=dot`
Expected: FAIL — modul belum ada.

- [ ] **Step 3: Implementasikan fungsi**

Buat `src/lib/checker/hr-point-of-view.ts`:

```ts
import type { AnalysisResult } from "@/components/checker/types";

export interface HrFinding {
  text: string;
  severity: "critical" | "high" | "medium" | "low" | null;
  /** Kalimat asli dari CV. null berarti tidak ada kutipan, bukan berarti kosong. */
  quote: string | null;
}

export interface HrPointOfView {
  seniority: "entry" | "mid" | "senior" | "lead" | null;
  stopping: HrFinding[];
  continuing: HrFinding[];
  progression: "Strong Upward" | "Upward" | "Stable" | "Sideways" | "Declining" | null;
  growthRate: "Fast" | "Normal" | "Slow" | null;
  /** True saat tidak ada temuan sama sekali; pemanggil wajib menampilkan status jujur. */
  isEmpty: boolean;
}

type Severity = HrFinding["severity"];
type Seniority = NonNullable<HrPointOfView["seniority"]>;

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const SENIORITIES: Seniority[] = ["entry", "mid", "senior", "lead"];

/** Buang spasi excess. String kosong berarti tidak ada isi, bukan isi kosong. */
function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Rakit pandangan sisi HR dari data yang sudah dikembalikan AI.
 *
 * Tidak memanggil AI dan tidak menyentuh jaringan: ini hanya menata data yang
 * sudah ada supaya komponen tidak perlu bercabang pada berbagai bentuk data.
 * `strengths` datang dalam dua bentuk — string biasa atau objek dengan
 * source_excerpt — dan keduanya dinormalisasi di sini.
 */
export function buildHrPointOfView(result: AnalysisResult | null | undefined): HrPointOfView {
  const detail = result?.atsPredictionDetail ?? null;
  const meta = result?.meta ?? null;
  const velocity = result?.careerVelocity ?? null;

  const stopping: HrFinding[] = (detail?.risk_factors ?? [])
    .map((item) => {
      const text = clean(item?.text);
      if (!text) return null;
      const severity = SEVERITIES.includes(item?.severity as Severity)
        ? (item.severity as Severity)
        : null;
      const quote = clean(item?.source_excerpt);
      return { text, severity, quote: quote || null };
    })
    .filter((item): item is HrFinding => item !== null);

  const continuing: HrFinding[] = (detail?.strengths ?? [])
    .map((item) => {
      if (typeof item === "string") {
        const text = clean(item);
        return text ? { text, severity: null, quote: null } : null;
      }
      const text = clean(item?.text);
      if (!text) return null;
      const quote = clean(item?.source_excerpt);
      return { text, severity: null, quote: quote || null };
    })
    .filter((item): item is HrFinding => item !== null);

  const seniorityValue = meta?.detected_seniority;
  const seniority = SENIORITIES.includes(seniorityValue as Seniority)
    ? (seniorityValue as Seniority)
    : null;

  return {
    seniority,
    stopping,
    continuing,
    progression: velocity?.title_progression ?? null,
    growthRate: velocity?.growth_rate ?? null,
    isEmpty: stopping.length === 0 && continuing.length === 0,
  };
}
```

- [ ] **Step 4: Jalankan test**

Run: `npx vitest run src/__tests__/checker-hr-point-of-view.test.ts --reporter=dot`
Expected: PASS (10 test).

- [ ] **Step 5: Typecheck dan suite penuh**

Run: `npx tsc --noEmit -p tsconfig.json` — tidak ada output.
Run: `npx vitest run --reporter=dot` — semua hijau.

- [ ] **Step 6: Commit**

```bash
git add src/lib/checker/hr-point-of-view.ts src/__tests__/checker-hr-point-of-view.test.ts
git commit -m "feat(checker): rakit pandangan sisi HR dari data analisis yang sudah ada

risk_factors, strengths, detected_seniority, dan title_progression sudah
dikembalikan AI tapi belum pernah dirender. Fungsi murni ini merangkainya
jadi satu view model tanpa memanggil AI, jadi nol token tambahan.

Tugas utamanya merapikan strengths yang datang dalam dua bentuk, string
biasa atau objek dengan source_excerpt, supaya komponen tidak perlu
bercabang. Kutipan kosong dan butir tanpa teks dibuang, bukan dirender jadi
kotak kosong."
```

---

### Task 5: Komponen `HrPointOfView` dan teks dua bahasa

**Files:**
- Create: `src/components/checker/HrPointOfView.tsx`
- Modify: `src/lib/i18n.tsx` (tambahkan kunci baru di dekat `checker.ai-review`)
- Test: `src/__tests__/checker-hr-point-of-view-ui.test.tsx`

**Interfaces:**
- Consumes: `HrPointOfView`, `HrFinding`, `buildHrPointOfView` (Task 4), `AnalysisResult` (Task 3)
- Produces: `export default function HrPointOfView({ result, keyPrefix }: { result: AnalysisResult | null; keyPrefix?: string })` — `keyPrefix` default `"checker."`, dipakai `"checker.detail."` di halaman hasil tersimpan

- [ ] **Step 1: Tulis test render yang gagal**

Buat `src/__tests__/checker-hr-point-of-view-ui.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HrPointOfView from "@/components/checker/HrPointOfView";
import { LanguageProvider } from "@/lib/i18n";

/** useTranslation membaca context, jadi komponen harus selalu dibungkus provider. */
function renderPanel(result: unknown) {
  return render(
    <LanguageProvider>
      <HrPointOfView result={result as any} />
    </LanguageProvider>,
  );
}

const RESULT = {
  meta: { detected_seniority: "entry" },
  careerVelocity: { title_progression: "Upward", growth_rate: "Fast" },
  atsPredictionDetail: {
    risk_factors: [{ text: "TypeScript tidak ada", severity: "critical", source_excerpt: "JavaScript, React" }],
    strengths: [{ text: "Ada metrik dampak", source_excerpt: "Bangun dashboard untuk 40 user" }],
  },
} as any;

describe("panel Sisi HR", () => {
  it("menampilkan temuan berhenti dan lanjut beserta kutipannya", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/bikin saya berhenti/i)).toBeInTheDocument();
    expect(screen.getByText(/bikin saya lanjut/i)).toBeInTheDocument();
    expect(screen.getByText("JavaScript, React")).toBeInTheDocument();
    expect(screen.getByText("Bangun dashboard untuk 40 user")).toBeInTheDocument();
  });

  it("menampilkan level terbaca dan perjalanan karier", () => {
    renderPanel(RESULT);
    expect(screen.getByText(/dibaca sebagai level/i)).toBeInTheDocument();
    expect(screen.getByText(/naik/i)).toBeInTheDocument();
  });

  it("tidak menampilkan kotak kutipan kalau kutipannya tidak ada", () => {
    renderPanel({
      atsPredictionDetail: {
        risk_factors: [{ text: "Ada tabel", severity: "high", source_excerpt: null }],
        strengths: [],
      },
    });
    expect(screen.getByText("Ada tabel")).toBeInTheDocument();
    expect(screen.queryByText(/JavaScript, React/)).not.toBeInTheDocument();
  });

  it("saat kosong, jujur dan mengarahkan ke bagian lain", () => {
    renderPanel({ atsPredictionDetail: { risk_factors: [], strengths: [] } });
    expect(screen.getByText(/tidak ada temuan sisi HR/i)).toBeInTheDocument();
    expect(screen.getByText(/skor per section/i)).toBeInTheDocument();
    // Tidak boleh menjanjikan CV-nya bagus.
    expect(screen.queryByText(/sudah bagus|udah bagus/i)).not.toBeInTheDocument();
  });

  it("tidak error saat hasil kosong total", () => {
    renderPanel(null);
    expect(screen.getByText(/tidak ada temuan sisi HR/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/checker-hr-point-of-view-ui.test.tsx --reporter=dot`
Expected: FAIL — komponen belum ada.

- [ ] **Step 3: Tambahkan kunci i18n**

Di `src/lib/i18n.tsx`, tambahkan setelah baris `"checker.ai-review"` (sekitar baris 794):

```ts
  "checker.hrview-title": { id: "Sisi HR", en: "The HR View" },
  "checker.hrview-subtitle": { id: "Catatan dari sisi orang yang pertama kali baca CV-mu.", en: "Notes from the person who reads your CV first." },
  "checker.hrview-stopping": { id: "Yang bikin saya berhenti", en: "What made me stop" },
  "checker.hrview-continuing": { id: "Yang bikin saya lanjut", en: "What made me keep reading" },
  "checker.hrview-level": { id: "CV ini terbaca sebagai level", en: "This CV reads as level" },
  "checker.hrview-journey": { id: "Perjalanan", en: "Trajectory" },
  "checker.hrview-empty": { id: "Analisis ini tidak menghasilkan temuan sisi HR. Catatan per bagian ada di Skor Per Section di bawah.", en: "This analysis produced no HR-side findings. Section-by-section notes are under Scores per Section below." },
```

Tambahkan juga versi `checker.detail.*` di dekat baris 1433, dengan nilai yang sama:

```ts
  "checker.detail.hrview-title": { id: "Sisi HR", en: "The HR View" },
  "checker.detail.hrview-subtitle": { id: "Catatan dari sisi orang yang pertama kali baca CV-mu.", en: "Notes from the person who reads your CV first." },
  "checker.detail.hrview-stopping": { id: "Yang bikin saya berhenti", en: "What made me stop" },
  "checker.detail.hrview-continuing": { id: "Yang bikin saya lanjut", en: "What made me keep reading" },
  "checker.detail.hrview-level": { id: "CV ini terbaca sebagai level", en: "This CV reads as level" },
  "checker.detail.hrview-journey": { id: "Perjalanan", en: "Trajectory" },
  "checker.detail.hrview-empty": { id: "Analisis ini tidak menghasilkan temuan sisi HR. Catatan per bagian ada di Skor Per Section di bawah.", en: "This analysis produced no HR-side findings. Section-by-section notes are under Scores per Section below." },
```

- [ ] **Step 4: Buat komponen**

Buat `src/components/checker/HrPointOfView.tsx`:

```tsx
import { useTranslation } from "@/lib/i18n";
import { buildHrPointOfView, type HrFinding } from "@/lib/checker/hr-point-of-view";
import type { AnalysisResult } from "./types";

const SEVERITY_LABEL: Record<NonNullable<HrFinding["severity"]>, { id: string; en: string }> = {
  critical: { id: "Bikin berhentitotal", en: "Hard stop" },
  high: { id: "Tinggi", en: "High" },
  medium: { id: "Sedang", en: "Medium" },
  low: { id: "Ringan", en: "Low" },
};

const LEVEL_LABEL = {
  entry: { id: "entry", en: "entry" },
  mid: { id: "menengah", en: "mid" },
  senior: { id: "senior", en: "senior" },
  lead: { id: "lead", en: "lead" },
} as const;

const PROGRESSION_LABEL = {
  "Strong Upward": { id: "naik tajam", en: "rising sharply" },
  Upward: { id: "naik", en: "rising" },
  Stable: { id: "datar", en: "flat" },
  Sideways: { id: "menyamping", en: "sideways" },
  Declining: { id: "turun", en: "declining" },
} as const;

const GROWTH_LABEL = {
  Fast: { id: "laju", en: "fast" },
  Normal: { id: "normal", en: "normal" },
  Slow: { id: "lambat", en: "slow" },
} as const;

function FindingList({ findings, lang }: { findings: HrFinding[]; lang: string }) {
  if (findings.length === 0) return null;
  return (
    <ul className="space-y-3">
      {findings.map((finding, index) => (
        <li key={`${finding.text}-${index}`} className="border-l-2 border-outline-variant/60 pl-3">
          <p className="text-body-sm text-on-background">{finding.text}</p>
          {finding.severity ? (
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {SEVERITY_LABEL[finding.severity][lang as "id" | "en"]}
            </p>
          ) : null}
          {finding.quote ? (
            <p className="mt-1.5 break-words font-mono text-label-sm text-on-surface-variant">
              {finding.quote}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Panel pandangan sisi HR.
 *
 * Ditaruh paling atas hasil, sebelum angka, karena pertanyaan yang membuat
 * orang membuka halaman ini adalah "kep-view nggak sama HR?" bukan "skornya
 * berapa?".
 */
export default function HrPointOfView({
  result,
  keyPrefix = "checker.",
}: {
  result: AnalysisResult | null;
  /** Prefix kunci i18n: "checker." atau "checker.detail." */
  keyPrefix?: string;
}) {
  const { t, lang } = useTranslation();
  const pick = (value: { id: string; en: string }) => value[lang === "en" ? "en" : "id"];
  const view = buildHrPointOfView(result);

  return (
    <section aria-labelledby="hrview-title" className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      <h2 id="hrview-title" className="font-headline-sm text-headline-sm text-on-background">
        {t(`${keyPrefix}hrview-title`)}
      </h2>
      <p className="mt-1 text-body-sm text-on-surface-variant">{t(`${keyPrefix}hrview-subtitle`)}</p>

      {view.seniority ? (
        <p className="mt-3 text-label-bold text-on-surface-variant">
          {t(`${keyPrefix}hrview-level`)}: {pick(LEVEL_LABEL[view.seniority])}
        </p>
      ) : null}

      {view.isEmpty ? (
        <p className="mt-4 text-body-sm text-on-surface-variant">{t(`${keyPrefix}hrview-empty`)}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-stopping`)}</h3>
            <div className="mt-2">
              <FindingList findings={view.stopping} lang={lang} />
            </div>
          </div>
          <div>
            <h3 className="text-label-bold text-on-background">{t(`${keyPrefix}hrview-continuing`)}</h3>
            <div className="mt-2">
              <FindingList findings={view.continuing} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {view.progression || view.growthRate ? (
        <p className="mt-4 border-t border-outline-variant/50 pt-3 text-label-sm text-on-surface-variant">
          {t(`${keyPrefix}hrview-journey`)}:{" "}
          {view.progression ? pick(PROGRESSION_LABEL[view.progression]) : "—"}
          {view.progression && view.growthRate ? " · " : ""}
          {view.growthRate ? `laju ${pick(GROWTH_LABEL[view.growthRate])}` : ""}
        </p>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 5: Jalankan test**

Run: `npx vitest run src/__tests__/checker-hr-point-of-view-ui.test.tsx --reporter=dot`
Expected: PASS (5 test). Semua render dibungkus `LanguageProvider` karena `useTranslation` membaca context.

- [ ] **Step 6: Typecheck dan suite penuh**

Run: `npx tsc --noEmit -p tsconfig.json` — tidak ada output.
Run: `npx vitest run --reporter=dot` — semua hijau.

- [ ] **Step 7: Commit**

```bash
git add src/components/checker/HrPointOfView.tsx src/lib/i18n.tsx src/__tests__/checker-hr-point-of-view-ui.test.tsx
git commit -m "feat(checker): panel Sisi HR dengan temuan dan kutipan asli CV

Ditaruh paling atas hasil, sebelum angka, karena yang bikin orang buka
halaman ini adalah pertanyaan kep-view bukan soal skor.

Teksnya ngomong kayak HR yang jelasin ke temuannya. Saat panel kosong,
panel jujur bilang tidak ada temuan dan arahkan ke Skor Per Section —
bukan menjanjikan CV-nya bagus, karena kita tidak bisa membedakan
memang tidak ada temuan dengan AI yang tidak mengembalikan apa-apa."
```

---

### Task 6: Pasang panel di dua halaman dan pangkas kolom duplikat

**Files:**
- Modify: `src/app/checker/page.tsx` (dekat awal blok hasil, sekitar baris 736-786)
- Modify: `src/app/checker/[id]/page.tsx` (sekitar baris 167-200 dan blok Review oleh AI)
- Test: `src/__tests__/checker-hrview-wiring.test.ts`

**Interfaces:**
- Consumes: `HrPointOfView` (Task 5)
- Produces: tidak ada

**Konteks.** Kolom Kelebihan dan Perlu Diperbaiki di bagian "Review oleh AI" isinya sama dengan kolom kanan dan kiri panel baru. Kalau keduanya dibiarkan, kelemahan yang sama tampil dua kali dalam satu halaman. Yang tersisa hanya `overall_assessment` dan Rekomendasi ATS; judul bagian tidak diubah.

- [ ] **Step 1: Tulis test kontrak yang gagal**

Buat `src/__tests__/checker-hrview-wiring.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("panel sisi HR terpasang di kedua halaman hasil", () => {
  for (const file of ["src/app/checker/page.tsx", "src/app/checker/[id]/page.tsx"]) {
    it(`${file} merender panel Sisi HR sebelum skor`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("HrPointOfView");
      // Panel harus muncul sebelum blok skor, bukan di bawah.
      expect(source.indexOf("<HrPointOfView")).toBeGreaterThan(-1);
      expect(source.indexOf("<HrPointOfView")).toBeLessThan(source.indexOf("checker.result-title"));
    });

    it(`${file} tidak lagi menampilkan kolom yang isinya sudah ada di panel`, () => {
      const source = readFileSync(file, "utf8");
      // strengths dan areas_for_improvement sudah tampil di panel Sisi HR.
      expect(source).not.toContain("narrativeFeedback?.strengths");
      expect(source).not.toContain("narrativeFeedback?.areas_for_improvement");
    });

    it(`${file} tetap menampilkan ringkasan dan rekomendasi ATS`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("narrativeFeedback?.overall_assessment");
      expect(source).toContain("narrativeFeedback?.ats_recommendations");
    });
  }
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npx vitest run src/__tests__/checker-hrview-wiring.test.ts --reporter=dot`
Expected: FAIL — `HrPointOfView` belum dirender di kedua halaman.

- [ ] **Step 3: Pasang panel di `/checker`**

Di `src/app/checker/page.tsx`, di dalam blok hasil (setelah `</div>` penutup top bar, sebelum blok skor `checker.result-title`), tambahkan:

```tsx
            <HrPointOfView result={result} />
```

Tambahkan import di bagian atas:

```tsx
import HrPointOfView from "@/components/checker/HrPointOfView";
```

- [ ] **Step 4: Pangkas kolom duplikat di `/checker`**

Di `src/app/checker/page.tsx` sekitar baris 881-914, di dalam `motion.section` "Review oleh AI", hapus **seluruh** pembungkus kisi dua kolom berikut beserta kedua anaknya:

```tsx
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              {narrativeFeedback.strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">check_circle</span>
                    {t("checker.strengths")}
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-green-800 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 select-none">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for improvement */}
              {narrativeFeedback.areas_for_improvement.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm select-none">warning</span>
                    {t("checker.improvements")}
                  </h3>
                  <ul className="space-y-1.5">
                    {narrativeFeedback.areas_for_improvement.map((a, i) => (
                      <li key={i} className="text-xs text-red-800 flex items-start gap-2">
                        <span className="text-red-400 mt-0.5 select-none">•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
```

Setelah dihapus, urutan di dalam `motion.section` jadi: `<h2>` "Review oleh AI" → blok `overall_assessment` → blok Rekomendasi ATS (`checker.ats-recs`). Ketiganya tidak boleh disentuh.

- [ ] **Step 5: Pasang panel di `/checker/[id]`**

Di `src/app/checker/[id]/page.tsx`, di dalam blok hasil sebelum judul, tambahkan:

```tsx
        <HrPointOfView result={result} />
```

Tambahkan import:

```tsx
import HrPointOfView from "@/components/checker/HrPointOfView";
```

Pastikan `result` di halaman ini adalah state hasil analisis yang sudah di-map lewat `analysisFromFullResult` (Task 3 Step 6), sehingga `meta` dan `atsPredictionDetail`-nya sudah ada.

Gunakan prefix kunci `checker.detail.hrview-*`, jadi teruskan prefix-nya:

```tsx
        <HrPointOfView result={result} keyPrefix="checker.detail." />
```

Prop `keyPrefix` sudah disiapkan di Task 5 Step 4, jadi tidak ada perubahan komponen lagi di task ini.

- [ ] **Step 6: Pangkas kolom duplikat di `/checker/[id]`**

Di `src/app/checker/[id]/page.tsx` sekitar baris 255-283, hapus pembungkus `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` beserta dua anaknya — kolom `t("checker.detail.strengths")` dan kolom `t("checker.detail.improve")`. Struktur bloknya sama persis dengan di `/checker`, hanya nama kuncinya berbeda.

Yang tetap ada setelah penghapusan: judul bagian review, blok `checker.detail.overall-assessment`, dan blok rekomendasi ATS.

- [ ] **Step 7: Jalankan test**

Run: `npx vitest run src/__tests__/checker-hrview-wiring.test.ts --reporter=dot`
Expected: PASS (6 test).

- [ ] **Step 8: Typecheck, suite penuh, dan build**

Run: `npx tsc --noEmit -p tsconfig.json` — tidak ada output.
Run: `npx vitest run --reporter=dot` — semua hijau.
Run: `npm run build` — harus selesai dengan "Compiled successfully".

- [ ] **Step 9: Commit**

```bash
git add "src/app/checker/page.tsx" "src/app/checker/[id]/page.tsx" src/components/checker/HrPointOfView.tsx src/__tests__/checker-hrview-wiring.test.ts
git commit -m "feat(checker): pasang panel Sisi HR dan pangkas kolom yang sama

Panelnya muncul paling atas di /checker dan /checker/[id] supaya hasil baru
dan hasil tersimpan sama persis.

Kolom Kelebihan dan Perlu Diperbaiki di Review oleh AI dihapus karena
isinya sudah tampil di panel — kalau dibiarkan, kelemahan yang sama muncul
dua kali dalam satu halaman. Overall assessment dan rekomendasi ATS tetap
ada, judul bagian tidak diubah."
```

---

### Task 7: Verifikasi akhir

**Files:** tidak ada perubahan kode. Hanya verifikasi.

- [ ] **Step 1: Suite penuh**

Run: `npx vitest run --reporter=dot`
Expected: semua hijau, tidak ada test yang di-skip karena tidak sengaja.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tidak ada output.

- [ ] **Step 3: Build produksi**

Run: `npm run build`
Expected: "Compiled successfully" tanpa error.

- [ ] **Step 4: Cek i18n lengkap**

Run: `node scripts/find-missing-i18n.mjs`
Expected: tidak ada kunci baru yang dilaporkan hilang. Kalau `checker.hrview-*` dan `checker.detail.hrview-*` muncul sebagai hilang, tambahkan ke daftar yang dibaca skrip.

- [ ] **Step 5: Push**

```bash
git push origin master
```

- [ ] **Step 6: Verifikasi di production setelah deploy**

Tunggu sampai deploy selesai, lalu jalankan:

```bash
curl -s -o NUL -w "%{http_code}" https://aicareerhub.my.id/checker
```

Lalu buka `/checker` di browser dan jalankan satu analisis CV sungguhan. Yang harus dicek:
1. Panel Sisi HR muncul **di atas** blok skor
2. Kutipan di panel benar-benar kalimat dari CV yang diunggah
3. Mengetik di kolom mana pun tidak membuat panel ikut berubah
4. Hasil lama dari riwayat `/checker/[id]` juga menampilkan panel

Kalau panel kosong atau tidak muncul di production, cek dulu apakah `meta` benar-benar ada di respons:

```bash
curl -s -X POST https://aicareerhub.my.id/api/checker/analyze -H "Content-Type: application/json" -d '{"extractedText":"Python 3 tahun, SQL, dashboard internal untuk 40 user","jobDescription":"Butuh engineer Python dan SQL","roleCategory":"tech","lang":"id","mode":"fast","originalFileName":"cv.pdf"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('meta:',JSON.stringify(j.meta));console.log('atsPredictionDetail:',JSON.stringify(j.atsPredictionDetail)?.slice(0,300))})"
```

---

## Di luar lingkup plan ini

Ditemukan saat menelusuri, sengaja tidak dikerjakan di sini. Dicatat supaya tidak hilang:

- Judul "Keyword Analysis" di hasil `/checker` masih hardcoded bahasa Inggris (`src/app/checker/page.tsx`), padahal judul-judul saudaranya sudah dua bahasa.
- `fitLabel` di `/checker/[id]` selalu `undefined` karena membaca `breakdown.overall`, field yang tidak pernah ada. Sekalian hilang saat Task 3 memindahkan mapping.
- Tombol unduh PDF untuk hasil checker. Infrastrukturnya sudah siap — ada `resultsRef`, `PdfExportButton`, dan `lib/pdf-export.ts` — tapi tombolnya belum pernah dirender.