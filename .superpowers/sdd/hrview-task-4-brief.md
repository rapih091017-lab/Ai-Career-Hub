# Brief Task 4

Sumber: `docs/superpowers/plans/2026-10-18-checker-hr-point-of-view.md` (bagian Task 4)

Semua nilai, nama file, dan cuplikan kode di bawah diambil langsung dari plan.
Jadikan isi brief ini acuan requirements; jangan mengarang nilai lain.

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
 * `strengths` datang dalam dua bentuk ? string biasa atau objek dengan
 * source_excerpt ? dan keduanya dinormalisasi di sini.
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

