# Brief Task 5

Sumber: `docs/superpowers/plans/2026-10-18-checker-hr-point-of-view.md` (bagian Task 5)

Semua nilai, nama file, dan cuplikan kode di bawah diambil langsung dari plan.
Jadikan isi brief ini acuan requirements; jangan mengarang nilai lain.

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
          {view.progression ? pick(PROGRESSION_LABEL[view.progression]) : "?"}
          {view.progression && view.growthRate ? " ? " : ""}
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
panel jujur bilang tidak ada temuan dan arahkan ke Skor Per Section ?
bukan menjanjikan CV-nya bagus, karena kita tidak bisa membedakan
memang tidak ada temuan dengan AI yang tidak mengembalikan apa-apa."
```

---

