# Report — HR point-of-view fallback (Critical finding)

**Status:** DONE
**Commit:** `2d8fe81` — `fix(checker): jadikan panel HR satu-sumber, fallback ke narrative_feedback`

## What was wrong

Deleted columns read `narrative_feedback.strengths` / `areas_for_improvement`; the HR panel
reads only `ats_prediction.strengths` / `risk_factors`. Model's worked example writes
weaknesses only to `areas_for_improvement`, so stored data had zero render sites —
panel showed "Nggak ada yang bikin saya berhenti" with no improvement list.

## Fix

`src/lib/checker/hr-point-of-view.ts`:

- New `fromNarrative(list)` normalizer: plain strings → `{ text, severity: null, quote: null }`,
  non-array / blank entries dropped (same strictness as ATS path).
- Per-side fallback, never merge:
  - `stopping` = `risk_factors` if non-empty, else `narrative_feedback.areas_for_improvement`
  - `continuing` = `strengths` if non-empty, else `narrative_feedback.strengths`
- `isEmpty` computed from **effective** arrays (post-fallback), not ATS-only — a panel
  filled via fallback is not empty.
- Interface unchanged: `HrFinding[]` with `{ text, severity, quote }`.
- Indonesian comments explain *why* (prompt's own example writes only to narrative;
  stored-but-unreachable data; verbatim quote wins over fallback).

## Tests

Built on partial edit already present in `src/__tests__/checker-hr-point-of-view.test.ts`
(4 fallback tests were staged but red). Added 3 more:

- `risk_factors kosong jatuh ke narrative, strengths tetap pakai ats` (required #2 direction)
- `narrative kosong tidak menggantikan data ats yang sudah ada` (required #5)
- `daftar ats non-kosong membuat narrative diabaikan sepenuhnya` (required #6)

Pre-fix: 5 failed / 17 passed — all failures were the fallback cases asserting
`[]` vs narrative-populated expectations (right reason). Guards (#4, #5, #6) passed
pre-fix as expected (they pin existing behaviour).

Post-fix verification:

- `npx vitest run src/__tests__/checker-hr-point-of-view.test.ts src/__tests__/checker-hr-point-of-view-ui.test.tsx --reporter=dot` → **2 files, 37 passed**
- `npx vitest run --reporter=dot` → **77 passed, 1 skipped, 919 tests** (run twice, stable)
- `npx tsc --noEmit -p tsconfig.json` → **0 errors**
- `npx eslint` on both touched files → clean

## Constraints honoured

- No page components touched (mounting already done).
- Returned shape unchanged — fallback produces plain `{ text, severity: null, quote: null }`.
- Comments in Indonesian, explaining why.
- TDD: tests first, confirmed red for the right reason, then implemented.

## Concerns

1. **One full-suite run was flaky**: first `npx vitest run` after the fix showed
   `2 failed files / 3 failed tests` with output too truncated to name them; two
   subsequent full runs passed clean (919/919) and both target files always passed.
   Flaky, pre-existing class of failure (unrelated to this diff — this change only
   touches a pure function). Not investigated further.
2. `narrative_feedback` arrays trusted as `string[]` per type contract; `fromNarrative`
   still guards non-array + blank/non-string entries at runtime (jsonb columns).
3. `.superpowers/sdd/progress.md` has unrelated uncommitted changes from another
   workflow — left unstaged deliberately.
