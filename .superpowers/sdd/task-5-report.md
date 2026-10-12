# Task 5 Report — Print stylesheet + tombol Simpan PDF

**Status:** DONE
**Commit:** 45c32c5 `feat(portfolio): tampilan cetak dan tombol Simpan PDF`

## What changed per file

- **`src/app/portfolio/print.css`** (new) — `@page { size: A4; margin: 12mm }` (unscoped, cannot be — fine, portfolio-only intent) + `@media print` block fully scoped under `[data-pf-print]` so nothing leaks into other app pages even though the CSS is statically imported by two routes. Handles: hide `.pf-atmosphere` / `.pf-chrome` / `[data-pf-print-hidden]`; `-webkit-print-color-adjust: exact` + unprefixed on `[data-pf-print]` and all descendants; `box-shadow: none` + `backdrop-filter: none` + `break-inside: avoid` on cards (targeted via `section [style*="border-radius"]` — cards carry inline borderRadius, no shared class in real DOM); `break-after: avoid` on h1–h4; external link hrefs printed after the text.
- **`src/app/p/[slug]/page.tsx`** — `searchParams` read as `Promise<{ print?: string }>` (Next 15), awaited alongside `params`. `printMode` wraps the document in `<div data-pf-print="true">` and sets `data-pf-print-hidden="true"` on the footer. CSS loaded via static `import "@/app/portfolio/print.css"` — always present, harmless on screen (all rules live inside `@media print`). Note: relative import `"../portfolio/print.css"` failed webpack resolution from the `[slug]` directory; alias import works.
- **`src/app/portfolio/preview/page.tsx`** — static `import "../print.css"`. New `?print=1` branch: renders bare `data-pf-print` wrapper with PortfolioDocument in `mode="static"`, injects `STATIC_REVEAL_FALLBACK_CSS` (imported from PortfolioDocument — reuse, no duplication) in a `<style media="print">`, plus a floating "Cetak / Simpan PDF" print trigger (min-h-11 = 44px, token colors from theme). Main toolbar got the "Simpan PDF" button: `window.open(publishedSlug ? '/p/<slug>?print=1' : '/portfolio/preview?print=1', '_blank', 'noopener')`, 44px min height, design tokens, no hex literals. `publishedSlug` fetched from existing `/api/portfolio/publish` GET (same endpoint PublishDialog uses).
- **`src/lib/i18n.tsx`** — added `preview.save-pdf` (id: "Simpan PDF", en: "Save PDF") for the button title/aria.
- **Sections marked `pf-atmosphere`** (decorative only, content untouched):
  - `HeroSection.tsx`: FloatingParticles wrapper (L77), GlassHero orbs container (L153), BrutalHero grain (L281), LuxeHero grain (L428), LuxeHero ambient glow (L436)
  - `AboutSection.tsx`: orb container (L20)
  - `StatsSection.tsx`: decorative background SVG (L20)
  - `ProjectsSection.tsx`: grain overlay (L198)
  - `TestimonialsSection.tsx`: orb container (L22), grain overlay (L183)
- **`src/__tests__/portfolio-print.test.ts`** (new) — brief's test suite plus one extra assertion: all rules scoped under `[data-pf-print]`.

## Motion opacity in print

Reused `STATIC_REVEAL_FALLBACK_CSS` (exported from PortfolioDocument.tsx:272) — imported into the preview print branch as `<style media="print">`. Also: preview print branch renders with `mode="static"` which sets `MotionConfig reducedMotion="always"`, so animations resolve to final state immediately. `/p/[slug]` static mode already had this. CSS could not import TS; used the TS import side instead of duplicating selectors.

## Duplication with generateExportHtml

`generateExportHtml` (preview page) has zero print CSS in its current inline `<style>` block — no `@media print`, no A4, nothing. No duplication found in this task; the later task rewriting it can simply embed the same `print.css` content (minus the `[data-pf-print]` scoping, which it doesn't need).

## Commands & real output

```
npx vitest run src/__tests__/portfolio-print.test.ts   → FAIL first (file missing), then: Tests 6 passed (6)
npm test                                               → Test Files 13 passed (13), Tests 282 passed (282)
npx tsc --noEmit                                       → clean (no output)
npx next build                                         → "✓ Compiled successfully in 7.5s"
```

Build caveat: full build then fails at page-data collection with env validation (`DATABASE_URL`, `AUTH_SECRET`, `DEEPSEEK_API_KEY` missing — this worktree has no `.env`; pre-existing, unrelated to task). Compile + typecheck stages pass.

## Deviations

1. Brief's `@media print` nesting of `@page`: moved `@page` outside `@media print` (both valid; outside is more conventional).
2. Brief's `.pf-card` selector dropped — no such class exists in real DOM. Cards targeted via `[style*="border-radius"]` as judged from real code (traps section warned against `.pf-section > *`).
3. CSS load: static import, not `await import()` — the brief's dynamic import inside a server component body is not reliable; Next docs (`node_modules/next/dist/docs` absent in this install) — static import is the working pattern verified by build.
4. Preview print branch uses `window.print()` trigger button since drafts have no `/p/` URL; browser print dialog saves PDF.
5. Relative `../portfolio/print.css` import from `src/app/p/[slug]/` fails webpack; used `@/app/portfolio/print.css`.

## Concerns

- `?print=1` on `/p/[slug]` still loads the global app stylesheet; scoped print rules were tested by regex only, not visually in a browser print preview.
- The floating "Cetak / Simpan PDF" button in preview print mode is visible on screen but hidden in print output via `.pf-chrome`.

## Fix wave 1

Commit: b1fc2b2

### Critical — blank print on /p/[slug]?print=1
- `/p/[slug]/page.tsx` now renders `<style media="print">` with `@page { size:A4; margin:12mm }` + `STATIC_REVEAL_FALLBACK_CSS` (the exported constant, not a copy) when `printMode`.
- Preview page already used the exported constant — unified, now shares the identical inline print style payload.

### Important — @page leak
- Removed `@page` from `print.css` (file is in shared static bundle via two route imports; `@page` cannot be scoped by selector). `@page` now rendered inline only inside `@media print` at the two print entry points (`/p/[slug]?print=1`, `/portfolio/preview?print=1`), so other app pages never receive it.

### Minor
- preview/page.tsx hardcodes replaced with i18n: `preview.save-pdf` (button) and new key `preview.print-save-pdf` ("Cetak / Simpan PDF") added to `src/lib/i18n.tsx`.
- print.css blur-neutralizing selector extended: `[data-pf-print] [style*="backdrop-filter"]` added — GlassContact carries `backdropFilter` without inline `borderRadius`; verified ContactSection.tsx:44 confirms the gap.

### Tests
- Red: 3 failed / 6 passed (9 tests) after adding assertions for @page absence in shared css, reveal rule on /p/[slug], backdrop-filter selector, preview constant reuse.
- Green: `npx vitest run src/__tests__/portfolio-print.test.ts` → 9 passed.
- Full: `npm test` → Test Files 13 passed, Tests 285 passed (282 + 3 new).
- `npx tsc --noEmit` → clean.
