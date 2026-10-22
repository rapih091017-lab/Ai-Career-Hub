# Report — HR point-of-view honesty fixes C2 + C3 (Critical findings)

**Status:** DONE
**Commits:**
- `606908f` — `fix(checker): butir rusak gugur per item dan copy kosong tidak mengklaim CV tanpa temuan` (C2)
- `fbce3c5` — `fix(checker): level dan arah karier tidak menyuntik default yang bukan dari AI` (C3)

## C2 — one malformed item wiped the whole list

**What was wrong:** `IssueOrString()` was a strict union (no per-item `.catch()`), so a single
item with `"CRITICAL"`, a stray `null`, or an unexpected type made `z.array(IssueOrString()).catch([])`
validate the **entire** array to `[]`. The panel then rendered "Analisis ini tidak menghasilkan
temuan sisi HR" — a factual claim — when the model had produced findings.

**Fix (layer 1, data):** `src/lib/ai/prompts/schemas.ts`
- `IssueArr()` = `z.array(IssueOrString().catch("")).catch([]).transform(filter out "")`.
  Per-item degradation: malformed item becomes the `""` sentinel, then is filtered so the
  parsed array truly *drops* it (no empty-string entries stored or rendered).
- `StrengthArr()` got the same treatment — identical strict-union wipe on the "keep reading"
  list (same dishonesty class: empty column claims "Nggak ada yang bikin saya lanjut baca").
- Element type unchanged (`string | { text, source_excerpt, severity? }`), no consumer type fallout.

**Fix (layer 2, copy):** `src/lib/i18n.tsx`, keys `checker.hrview-empty` and
`checker.detail.hrview-empty` (both languages):
- id: `Nggak ada temuan sisi HR yang balik dari analisis ini. Catatan per bagian ada di bawah.`
- en: `No HR-side findings came back from this analysis. Section-by-section notes are below.`
- States what came back from the analysis (reader-verifiable), keeps the pointer to
  per-section notes, casual recruiter register (`Nggak…`, matches `Nggak ada yang bikin…`),
  never asserts anything about the CV itself.

## C3 — level / career lines displayed values the AI never sent

**What was wrong:** `meta.detected_seniority.catch("mid")`, `career_velocity.title_progression.catch("Stable")`,
`career_velocity.growth_rate.catch("Normal")` — plus the same three literals inside the **object-level**
`.catch()` defaults (a `meta: null` input fell into the object catch and got `"mid"` anyway).
Those values sit on `buildHrPointOfView`'s allowlists, so omitted fields still rendered
"CV ini dibaca sebagai level: menengah" / "Arah karier: datar · Laju karier: wajar".

**Fix:** `src/lib/ai/prompts/schemas.ts`
- All three fields: `.catch(x)` → `.optional()`.
- Removed the three literals from the `meta` and `career_velocity` object-level `.catch()` defaults
  (otherwise `meta: null` / whole-object fallback kept manufacturing them).
- Indonesian comments explain why the default is forbidden.

**Dependency check:** nothing else in the app reads these three fields. Only consumers are
`src/lib/checker/hr-point-of-view.ts` (allowlist → null, no change needed), the prompt example
JSON in `analysis-v3.ts`/`analysis-v4.ts` (model-facing example output, not a display default),
and tests. `src/components/checker/types.ts` already declared all three optional. No other
default consumer found; nothing reintroduced.

## Tests (TDD — each written first, confirmed RED for the right reason)

C2 (`606908f`):
- `prompt-schemas.test.ts`: one malformed `risk_factors` item → two valid ones survive (was `[]`);
  same for `strengths` (was `[]`).
- `checker-hr-point-of-view-ui.test.tsx`: through `AnalysisResultSchema.parse` (production path) —
  one malformed risk factor + two valid → two render, malformed dropped; all risk factors malformed →
  empty state with new copy, asserts old "tidak menghasilkan temuan" absent and no
  "CV … tidak punya temuan" claim. Existing empty-copy assertions (id ×3, en ×1) updated to new copy.

C3 (`fbce3c5`):
- `checker-hr-point-of-view-ui.test.tsx`: `meta: null` → no level line; `meta: { cv_word_count: 300 }`
  → no level line; `career_velocity` without both enums → no trajectory/pace line; only
  `growth_rate` sent → pace line only, no trajectory line (all fed through schema parse — RED before fix).
- `checker-hr-point-of-view.test.ts`: direct bridge test — schema parse of AI output that omits
  the fields → `buildHrPointOfView` yields `seniority/progression/growthRate === null`.
  **This is the test that would have caught the bug**: before the fix it failed with
  `expected 'mid' to be null` (schema default accepted by the allowlist).
- `prompt-schemas.test.ts`: parsed `detected_seniority` / `title_progression` / `growth_rate`
  are `undefined` when omitted; `meta: null` does not resurrect `"mid"`.

## Verification (final state)

- `npx vitest run --reporter=dot` → 77 files passed, 930 tests passed, 1 skipped (baseline 919).
- `npx tsc --noEmit -p tsconfig.json` → clean.
- `npm run build` → exit 0.
- Each commit verified green at its own point (C2 state: full suite + tsc clean before commit).

## Concerns

1. `StrengthArr()` per-item tolerance is a same-class fix beyond the literal `IssueArr` wording
   in the finding; kept because an empty "keep reading" column makes the same false claim.
   Revert `606908f`'s `StrengthArr` hunk if scope must stay literal.
2. `meta: null` still falls into the **object-level** `.catch()` and returns the other defaults
   (`role_category: "general"`, `cv_word_count: 0`, …). Out of scope (spec: only the three fields),
   but those are also manufactured context values.
3. Invalid enum values (e.g. `detected_seniority: "principal"`) now trigger the whole-meta
   object catch instead of a per-field default — seniority ends up omitted (honest), but sibling
   meta fields reset to defaults. Pre-existing object-catch shape, unchanged per spec.
4. Per-item sentinel is `""`, so a model that legitimately emits an empty-string issue now has
   it dropped at schema level (previously rendered as empty row downstream) — treated as an improvement.
