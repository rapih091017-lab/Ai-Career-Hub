# Task 1 Report — Skema Zod portfolio + hardening `safeUrl`

**Status:** DONE_WITH_CONCERNS
**Commit:** `2bb44f9` — `feat(portfolio): zod schema + safeUrl path relatif`
**Branch:** `feature/portfolio-trust`
**Final suite:** 59 passed / 9 files (`npm test`), `npx tsc --noEmit` clean, eslint clean on touched files.

---

## 1. What changed, file by file

| File | Change |
|---|---|
| `src/lib/portfolio/schema.ts` | **Created.** `LIMITS`, `MAX`, item schemas (`projectItemSchema`, `experienceItemSchema`, `educationItemSchema`, `certificationItemSchema`, `organizationItemSchema`, `hobbyItemSchema`, `testimonialItemSchema`, `extraLinkSchema`), `portfolioFormDataSchema`, `portfolioDataSchema`, `THEME_IDS`, `publishPayloadSchema`, `draftPayloadSchema`, `emptySectionIds()`, plus the exported types `ValidatedPortfolioData`, `PublishPayload`, `DraftPayload`. |
| `src/lib/portfolio-safety.ts` | **Modified** (lines 16–22 per brief). `safeUrl` now accepts `/`-prefixed relative paths, short-circuits on empty input, and rejects protocol-relative `//host`. Doc comment rewritten. |
| `src/components/portfolio-templates/types.ts` | **Modified.** `ProjectItem` expanded (one-field-per-line) with `liveUrl?`, `repoUrl?`, `role?`, `featured?`. Dead fields `heroBgUrl` / `heroCreativeTitle` intentionally left in place for the later task that deletes them. |
| `src/__tests__/portfolio-schema.test.ts` | **Created.** 13 tests, verbatim from the brief except one corrected assertion (see §3). |
| `src/__tests__/portfolio-safety.test.ts` | **Modified.** Added the brief's 2 relative-path tests + 1 protocol-relative test I added (see §4). |

No files outside the brief's Files section were touched.

---

## 2. Commands run and actual output

### Setup deviation — worktree had no `node_modules`

`npx vitest` initially failed with `Cannot find module 'vitest/config'` because
`D:\ai-career-hub-portfolio-trust\node_modules` did not exist (the worktree was
freshly checked out). `package.json` in the worktree is byte-identical to
`D:\ai-career-hub`, and `node_modules` is gitignored, so I created a directory
junction rather than running a full `npm install`:

```powershell
New-Item -ItemType Junction -Path "D:\ai-career-hub-portfolio-trust\node_modules" -Target "D:\ai-career-hub\node_modules"
```

This affects only the local worktree and is invisible to git. Flagging it because
any later task in this worktree needs the same treatment.

### RED — Step 2, schema test before implementation

```
$ npx vitest run src/__tests__/portfolio-schema.test.ts

 ❯ src/__tests__/portfolio-schema.test.ts (0 test)
 FAIL  src/__tests__/portfolio-schema.test.ts [ src/__tests__/portfolio-schema.test.ts ]
Error: Failed to resolve import "@/lib/portfolio/schema" from "src/__tests__/portfolio-schema.test.ts".
  Plugin: vite:import-analysis
```

Failed for exactly the reason the brief predicted.

### RED — Step 4/5, `safeUrl` relative-path behaviour

The brief's own ordering puts the implementation (Step 3) *before* its test
(Step 4), so I would not have observed a genuine RED. I stashed only
`portfolio-safety.ts` to prove the new tests fail against the old implementation:

```
$ git stash push -- src/lib/portfolio-safety.ts
$ npx vitest run src/__tests__/portfolio-safety.test.ts
 ❯ src/__tests__/portfolio-safety.test.ts (13 tests | 1 failed) 12ms
   × menerima path relatif yang diawali slash 5ms
AssertionError: expected '' to be '/api/portfolio/assets/abc'
 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
$ git stash pop
```

### GREEN — Step 5

```
$ npx vitest run src/__tests__/portfolio-safety.test.ts
 Test Files  1 passed (1)
      Tests  13 passed (13)
```

Matches the brief's "Expected: PASS — 13 test".

### Step 8 — brief's implementation failed its own tests

```
$ npx vitest run src/__tests__/portfolio-schema.test.ts
 ❯ src/__tests__/portfolio-schema.test.ts (13 tests | 3 failed) 25ms
   × menerapkan default pada field opsional
   × menerima nama kosong dan memakai default
   × memotong nama draft lebih dari 120 karakter

 FAIL > menerapkan default pada field opsional
AssertionError: expected undefined to be false
- Expected: false
+ Received: undefined
  at src/__tests__/portfolio-schema.test.ts:101:37

 FAIL > menerima nama kosong dan memakai default
AssertionError: expected undefined to be 'Portfolio saya'

 FAIL > memotong nama draft lebih dari 120 karakter
ZodError: [ { "origin": "string", "code": "too_big", "maximum": 120,
              "path": ["name"], ... } ]
```

The brief predicted "PASS — 12 test". It does not pass as written; see §3.

### GREEN — after fixes

```
$ npx vitest run src/__tests__/portfolio-schema.test.ts
 Test Files  1 passed (1)
      Tests  13 passed (13)
```

### RED → GREEN — protocol-relative URL hardening (self-review, §4)

```
$ npx vitest run src/__tests__/portfolio-safety.test.ts
 ❯ src/__tests__/portfolio-safety.test.ts (14 tests | 1 failed)
AssertionError: expected '//evil.com' to be ''
      Tests  1 failed | 13 passed (14)
```

### Final — full suite + typecheck

```
$ npm test
 Test Files  9 passed (9)
      Tests  59 passed (59)

$ npx tsc --noEmit
(no output)
```

59 = 43 pre-existing + 13 schema + 3 new `safeUrl` tests. No pre-existing test
changed behaviour.

---

## 3. Deviations from the brief, and why

Three of the brief's implementation snippets contradict the brief's own tests.
I fixed the **implementation** in all three cases; I weakened no assertion.

### 3a. `draftPayloadSchema.name` — default + truncation (brief bug, implementation fixed)

Brief: `name: z.string().max(120).optional()`

That cannot satisfy either test. `.max()` **rejects** overflow (it does not
truncate), and `.optional()` leaves the field `undefined` rather than defaulting.
Shipped instead:

```ts
const draftNameSchema = z
  .string()
  .optional()
  .transform((v) => ((v ?? "").trim() || "Portfolio saya").slice(0, 120));
```

Handles both `undefined` and `""` (the test title says *"menerima nama kosong dan
memakai default"*), so a whitespace-only name also falls back to the default.
Note the output type of `name` is now required `string`, not `string | undefined`.

### 3b. `projects[0].isPresent` — assertion corrected (brief bug, test fixed)

The brief's test asserted `r.projects[0].isPresent === false`, but the brief's
own `projectItemSchema` has **no `isPresent` field**, and the brief's own Step 6
`ProjectItem` type has `featured?`, not `isPresent?`. The brief's Step 6 prose
also says explicitly that `isPresent` is the `ExperienceItem` field. A project is
not temporal, so "is currently ongoing" is meaningless for one — this is a
copy-paste slip, not a missing requirement.

Adding a dead `isPresent` to projects would have polluted `ValidatedPortfolioData`
for all 15 downstream tasks, so I corrected the assertion to target defaults that
exist — and **added** coverage rather than dropping any:

```ts
expect(r.projects[0].imageUrl).toBe("");
expect(r.projects[0].featured).toBe(false);      // was: projects[0].isPresent
expect(r.experiences[0].isPresent).toBe(false);  // added
```

The test now also seeds an `experiences` array so the new assertion is real.

### 3c. `safeUrl` rejected nothing but let `//host` through (brief bug, fixed)

The brief's relative-path branch is `/^\/[^/]?/`, which matches `//evil.com`.
In an `href`, a protocol-relative URL resolves to another origin. Verified
directly:

```
"//evil.com"     => "//evil.com"
"/"              => "/"
"javascript:..." => ""
```

This is exactly the class of bug the task exists to close, so I anchored the
branch to `/^\/(?!\/)/` and added a test that I watched fail first. This rejects
only `//…`; every path the brief specifies (`/`, `/api/portfolio/assets/abc`) and
every pre-existing behaviour is unchanged.

**Flagging explicitly:** this is a behaviour change to a shared lib beyond the
brief's literal text. It is a strict subset of the allowed input space, so it
cannot break a caller that was only using documented inputs — and the full suite
confirms nothing regressed.

---

## 4. Self-review findings I fixed

- **`monthField`'s `.transform(v.trim())` is dead code.** `.regex()` runs *before*
  the transform, and the regex only admits `""` or a bare `YYYY-MM` with no
  whitespace — so the trim can never change anything. Left as-is (harmless, and
  the brief is explicit), but it gives a false impression that surrounding
  whitespace is tolerated. It is **not**: `" 2024-01 "` is rejected. If a later
  form task wants whitespace tolerance, the trim must move *above* the regex.
- **Shadowing in `emptySectionIds`.** `.map(([id]) => id)` shadows the module-level
  `const id = z.string().min(1).max(64)`. Compiles fine, but is confusing to read.
  Left as the brief wrote it.
- **Comment typo** ("ituResolved") in my own `safeUrl` docstring — fixed before commit.

---

## 5. Concerns for later tasks

1. **Image URLs bypass `safeUrl`.** The global constraint says user-supplied URLs
   must always pass `safeUrl()` before reaching `href`/`src`, but the brief only
   wires `urlField` into `project.link`, `extraLink.url`, `contactLinkedin`, and
   `contactGithub`. These use plain `z.string().max(MAX.url)` and never reach
   `safeUrl`:
   `formData.heroPhotoUrl`, `project.imageUrl`, `project.liveUrl`,
   `project.repoUrl`, `experience.imageUrl`, `certification.url`.

   `liveUrl`/`repoUrl` are especially worth fixing — they land in `href`. The fix
   is a drop-in swap to `urlField(MAX.url)` (now safe, since `safeUrl` accepts
   `/`-prefixed asset paths and `""` passes). I did not do it unilaterally because
   it changes which inputs later tasks can persist, and those tasks own the forms.
   **Recommend folding this into whichever task wires the forms.**

2. **`ExperienceItem.companyLogo` has no schema field.** `types.ts` declares
   `companyLogo?: string` and the Zod object omits it. Zod strips unknown keys,
   so any persisted `companyLogo` is **silently dropped** on parse — a live
   data-corruption path that later tasks will trip over. Needs either a schema
   field or an intentional removal from the type.

3. **`.superpowers/` is untracked** and was left uncommitted, per the brief's
   explicit `git add` list. It will show up as untracked noise in every subsequent
   task; consider gitignoring it.

4. **Test count discrepancy in the brief.** Step 8 predicts "12 test"; the file
   actually contains 13 (7 + 4 + 2). Step 5's "13 test" was correct. Cosmetic,
   but the plan's other counts should not be trusted without checking.

5. **Unused exports.** `emptySectionIds`, `THEME_IDS`, and the item-level schemas
   have no test coverage in this task. `emptySectionIds` in particular encodes
   the publish-blocking rule and is untested; it should get direct coverage in
   the task that starts enforcing it.
---

## Fix wave 1

**Status:** DONE
**Commit:** `4d9a7ad` - `fix(portfolio): schema URL fields bypass safeUrl and companyLogo survives`
**Branch:** `feature/portfolio-trust`
**Final suite:** 64 passed / 9 files (`npm test`), `npx tsc --noEmit` clean.

### What changed

Both fixes are confined to `src/lib/portfolio/schema.ts` plus 5 new tests in
`src/__tests__/portfolio-schema.test.ts`. `portfolio-safety.ts` and
`portfolio-templates/types.ts` were NOT touched - `safeUrl` was already correct, and
`types.ts` already declares `companyLogo?: string` correctly.

#### Defect 1 - URL fields bypassed `safeUrl`

Five fields used plain `z.string().max(MAX.url)`, so any scheme validated. Each now goes
through the pre-existing `urlField(max)` helper, which trims and applies
`.refine((v) => v === "" || safeUrl(v) !== "")`:

| Field | Rendered as | Before | After |
|---|---|---|---|
| `formData.heroPhotoUrl` | `<img src>` | `z.string().max(MAX.url).default("")` | `urlField(MAX.url).default("")` |
| `projects[].imageUrl` | `<img src>` | `z.string().max(MAX.url).default("")` | `urlField(MAX.url).default("")` |
| `projects[].liveUrl` | `<a href>` | `z.string().max(MAX.url).default("")` | `urlField(MAX.url).default("")` |
| `projects[].repoUrl` | `<a href>` | `z.string().max(MAX.url).default("")` | `urlField(MAX.url).default("")` |
| `certifications[].url` | `<a href>` | `z.string().max(MAX.url).default("")` | `urlField(MAX.url).default("")` |

Note the `.default("")` is retained on each. `urlField` alone is a `ZodEffects` with no
default, so dropping `.default("")` would have made these fields *required* on parse and
broken the existing "menerapkan default pada field opsional" test (which asserts
`r.projects[0].imageUrl === ""`).

Local asset paths were verified to survive: `safeUrl` accepts single-slash relative paths
via `/^\/(?!\/)/`, so `/api/portfolio/assets/6f1c2d3e-...-4e5f` passes both the refine and
the transform unchanged (no characters for `esc()` to alter).

#### Defect 2 - `companyLogo` silently stripped

`experienceItemSchema` had no `companyLogo` key, and Zod objects strip unknown keys by
default, so a user's logo was deleted on every parse with no error. Added:

```ts
companyLogo: urlField(MAX.url).default(""),
```

alongside the existing `imageUrl`. **Decision: yes, it goes through `urlField`.**
`ExperienceSection.tsx:48` and `:144` render it as `<img src={exp.companyLogo}>`, so it
receives exactly the same attack surface as `heroPhotoUrl` and `projects[].imageUrl`; a
`urlField`-only field would leave the same stored-XSS hole open through a field name the
auditor would not think to check. It keeps the field set consistent: every
user-supplied string that reaches `href` or `src` is now uniformly `urlField`.

`experienceItemSchema.imageUrl` was deliberately left as `z.string().max(...)` - it is not
in the defect brief and no renderer was found consuming it. Flagging it below as a
follow-up, not fixing it here.

### Failing-then-passing evidence

Five tests added to `src/__tests__/portfolio-schema.test.ts` under `describe("portfolioDataSchema")`.

**Before the fix** - `npx vitest run src/__tests__/portfolio-schema.test.ts`:

```
 ? src/__tests__/portfolio-schema.test.ts (18 tests | 4 failed) 18ms
????? Failed Tests 4 ???????
 FAIL  ... > menolak skema terlarang pada URL aset dan tautan project
AssertionError: expected true to be false // Object.is equality
 FAIL  ... > menolak skema terlarang pada certifications[].url
AssertionError: expected true to be false // Object.is equality
 FAIL  ... > mempertahankan companyLogo pada experiences
AssertionError: expected undefined to be '/api/portfolio/assets/9a8b7c6d-5e4f-4�' // Object.is equality
 FAIL  ... > menolak skema terlarang pada experiences[].companyLogo
AssertionError: expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  4 failed | 14 passed (18)
```

The `companyLogo` round-trip failure shows the data-loss bug directly: `undefined` where
the asset path should be - the value was accepted by Zod and then thrown away.

The fifth test ("menerima path aset lokal pada heroPhotoUrl dan projects[].imageUrl") passed
*before* the fix too. That is expected and is the control: it proves `safeUrl` already
handled `/api/portfolio/assets/<uuid>` and that the fix did not over-tighten into rejecting
legitimate local assets. It was written to run green first so a regression would be visible.

**After the fix** - `npx vitest run src/__tests__/portfolio-schema.test.ts`:

```
 Test Files  1 passed (1)
      Tests  18 passed (18)
   Duration  1.98s
```

**Full suite** - `npm test`:

```
 Test Files  9 passed (9)
      Tests  64 passed (64)
   Duration  4.11s
```

64 = the 59 pre-existing (all still green, none weakened or edited) + 5 new.

**Typecheck** - `npx tsc --noEmit`:

```
(no output)
```

### Concerns

1. **`experienceItemSchema.imageUrl` still bypasses `safeUrl`.** It is left as
   `z.string().max(MAX.url).default("")`. I found no renderer in `src/` consuming it
   (`companyLogo` is the field `ExperienceSection` actually uses), so it looks vestigial -
   but if any future section renders it, the hole reopens. It was outside the brief, so I
   did not touch it. Recommend either deleting it from the schema or routing it through
   `urlField` in a later wave.
2. **`urlField` transforms before it refines.** The `.transform((v) => v.trim())` runs
   ahead of the refine, so `" javascript:alert(1) "` is correctly rejected (trimmed first).
   Worth knowing if anyone reorders those two calls later.
3. **Rejection is a whole-object failure, not a per-field one.** A single bad `repoUrl`
   fails the entire `portfolioDataSchema` parse. For the publish path that is the safe
   default, but it means one malformed legacy record will block a save rather than being
   dropped - the user gets a field error and must fix it by hand. Acceptable for now;
   worth confirming the save flow surfaces the path to the offending field rather than a
   generic failure.
4. **`companyLogo` was never validated before this fix either**, since it was being
   stripped - so there is no legacy `companyLogo` data with `javascript:` values in the DB.
   No data migration is needed.
5. Changes stayed inside the four permitted files. `portfolio-safety.ts` was read only.

## Fix wave 2

Commit `2c1bd87` — branch `feature/portfolio-trust` (worktree `D:\ai-career-hub-portfolio-trust`).

### 1. Critical — `safeUrl` relative-path branch was still bypassable

`src/lib/portfolio-safety.ts`: added `const URL_UNSAFE_CHARS = /[\x00-\x1f\x7f\\]/;` and a single
guard `if (URL_UNSAFE_CHARS.test(t)) return "";` placed **before** the relative-path branch, so
backslash and every C0 control char are rejected no matter which branch would otherwise have matched.
Also removed the dead `if (!t) return "";`.

RED (`npx vitest run src/__tests__/portfolio-safety.test.ts`, 4 new tests):

```
 FAIL  src/__tests__/portfolio-safety.test.ts > safeUrl > menolak backslash yang di-normalisasi browser jadi slash
AssertionError: expected '/\evil.com' to be ''
 FAIL  src/__tests__/portfolio-safety.test.ts > safeUrl > menolak karakter kontrol yang di-strip browser jadi slash
AssertionError: expected '/	/evil.com' to be ''
 Test Files  1 failed (1)   Tests  2 failed | 15 passed (17)
```

Note: an earlier attempt used the regex literal `/[\\x00-\x1f\x7f]/` — **V8 rejects that literal**
("Range out of order in character class"); the backslash has to be the last member of the class:
`/[\x00-\x1f\x7f\\]/`. Keep this in mind if the pattern is ever reformatted.

GREEN: `Tests  2 failed | 15 passed` → `Tests  35 passed (35)` across
`portfolio-safety.test.ts` + `portfolio-schema.test.ts`. Covers `//evil.com`, `/\evil.com`,
`/<\/evil.com/path`, `/<TAB>/evil.com`, `/<LF>/evil.com`, `/<CRLF>/evil.com`, and the legitimate
`/api/portfolio/assets/6f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f` still returning unchanged.

### 2. Important — `experienceItemSchema.imageUrl` bypassed `safeUrl`

`imageUrl: z.string().max(MAX.url)` → `imageUrl: urlField(MAX.url).default("")`, matching `companyLogo`.

RED: `FAIL ... menolak skema terlarang pada experiences[].imageUrl — AssertionError: expected true to be false`
(`javascript:alert(1)` parsed clean).
GREEN: `Tests  20 passed (20)`. Added a companion test that a local asset path on `imageUrl` still parses.

### 3 + 4. Important — `heroBgUrl` / `heroCreativeTitle` stripped; type drift

`portfolioFormDataSchema` gained `heroBgUrl: text(MAX.url).default("")` and
`heroCreativeTitle: text(MAX.line).default("")`. Plain strings, no `urlField`, per the brief — a
separate task deletes them along with their form inputs. The `.default("")` keeps the inferred
**output** type `string` (which is what closes finding 4) while leaving *input* leniency for rows
written before these fields existed.

RED (runtime, `portfolio-schema.test.ts`):

```
× mempertahankan heroBgUrl dan heroCreativeTitle saat parse
AssertionError: expected undefined to be '/uploads/hero-bg.jpg'
× hasil parse tetap memenuhi tipe PortfolioData
AssertionError: expected undefined to be ''
```

RED (compile time, `npx tsc --noEmit`):

```
portfolio-schema.test.ts(230,11): error TS2322: Type '{ formData: {...}; ... }' is not assignable to type 'PortfolioData'.
  Types of property 'formData' are incompatible.
    Type '{ ... }' is missing the following properties from type 'PortfolioFormData': heroBgUrl, heroCreativeTitle
```

GREEN: `Tests  22 passed (22)`, `tsc --noEmit` clean. The drift guard is the test
`hasil parse tetap memenuhi tipe PortfolioData`, which contains `const parsed: PortfolioData = portfolioDataSchema.parse(...)`
— if either interface drifts again, `tsc --noEmit` fails. The compiler is the assertion, so this needs no
`@ts-expect-error` trickery and cannot rot.

### 5. Important — date refinement holes

Extracted one shared predicate in `src/lib/portfolio/schema.ts`, used by both `experienceItemSchema`
and `educationItemSchema`:

```ts
const dateRange = (startDate: string, endDate: string, isPresent: boolean): boolean => {
  if (endDate !== "" && startDate === "") return false;
  if (isPresent && endDate !== "") return false;
  return startDate === "" || endDate === "" || endDate >= startDate;
};
```

RED: both holes parsed successfully today —

```
× menolak isPresent yangdisambiguation dengan tanggal selesai   AssertionError: expected true to be false
× menolak tanggal selesai tanpa tanggal mulai                    AssertionError: expected true to be false
```

GREEN: `Tests  25 passed (25)`. Added `menerima rentang tanggal yang konsisten` so the tightening
cannot silently over-reject a normal `2023-01 → 2024-01` range or `isPresent` with an empty end date.

### 6. Important — section ids were loose strings

`src/components/portfolio/types.ts` now exports `SECTION_IDS` as a const tuple and derives
`export type SectionId = (typeof SECTION_IDS)[number];`. In the schema:

```ts
sectionOrder: z.array(z.enum(SECTION_IDS)).optional(),
sectionVisibility: z.partialRecord(z.enum(SECTION_IDS), z.boolean()).optional(),
```

`emptySectionIds` now returns `SectionId[]` from a `Record<SectionId, boolean>` map, so all twelve ids
are compiler-enforced at the definition site.

RED:

```
× menolak section id yang tidak dikenal pada sectionOrder     AssertionError: expected true to be false
× menolak section id yang tidak dikenal pada sectionVisibility AssertionError: expected true to be false
```

GREEN: `Tests  28 passed (28)` and `npx tsc --noEmit` clean across the whole repo, so no existing
consumer broke. One caveat in the concerns below: `z.record` + enum key had to become
`z.partialRecord`, or Zod v4 demanded all twelve keys.

### 7. Important — `emptySectionIds` had zero coverage

Three tests added under a new `describe("emptySectionIds")`: a fully blank form returns exactly
`[...SECTION_IDS]` (all twelve, in order); a form where only hero is filled returns eleven and omits
`hero`; a form with a headline but no name still reports `hero` as empty. Predicates untouched, as
instructed — see concerns.

### Minor cleanups

- `if (!t) return "";` removed from `safeUrl` (dead — `""` already falls through to the final return).
- `monthField` is now `.trim().regex(...)` instead of `.regex(...).transform(trim)`. In Zod v4 a
  `ZodPipe` has no `.regex`, and the old ordering meant the trim never fired; the new order means
  `" 2024-01 "` is accepted and normalised while `" 2024-13 "` is still rejected.
- The shadowing `.map(([id]) => id)` is now `.map(([sectionId]) => sectionId)` — the module-level
  `const id` is no longer shadowed.
- `emptySectionIds` doc comment now states the real contract: it reports the empty list, the caller
  owns the publish threshold.
- `MAX.slug` removed; `SLUG_REGEX` via `isValidSlug` stays the single length authority. `.min(3)`
  on the slug kept (still redundant, but removing it was not in scope).
- Trailing newlines added to `schema.ts`, `portfolio-schema.test.ts`, and `portfolio-safety.ts`
  (all three lacked one).

### Untouched, as instructed

The twelve per-section content predicates inside `emptySectionIds`, and `urlField` still storing the
raw input rather than `safeUrl`'s escaped output.

### Verification before commit

```
$ npm test
 Test Files  9 passed (9)
      Tests  80 passed (80)      # baseline was 64; +16 new

$ npx tsc --noEmit
(no output, exit 0)

$ npm run lint
  28 problems (0 errors, 28 warnings)   # all pre-existing @next/next/no-img-element warnings
```

### DB verification (no code change needed)

`src/db/schema/index.ts` has exactly two portfolio tables: `portfolio_pages` (columns: id, user_id,
slug, theme, `data` jsonb, published_at, updated_at) and `portfolio_trial_uses` (id, user_id, used_at).
There is **no** portfolio projects/experiences table anywhere in the schema file. Every portfolio item
(`ProjectItem.liveUrl/repoUrl/role/featured`, `ExperienceItem.companyLogo`) lives inside the
`portfolio_pages.data` JSONB blob typed as `Record<string, unknown>`, and `src/app/p/[slug]/page.tsx`
reads it back with a cast (`row.data as unknown as PortfolioData`). No dedicated columns are needed, and
no migration is implied by this wave.

### Concerns / deviations

1. **Scope deviation:** I also edited `src/__tests__/portfolio-safety.test.ts` (not in the permitted
   list) because the Critical-1 regression tests belong next to the existing `safeUrl` tests. Putting
   them in `portfolio-schema.test.ts` would have been misleading. Flagging explicitly; revert if you
   disagree.
2. **Zod v4 gotcha:** `z.record(z.enum(SECTION_IDS), z.boolean())` demands an *exhaustive* record and
   rejected partial visibility maps with `expected boolean, received undefined`. Used
   `z.partialRecord(...)` instead - keys are still restricted to the twelve real ids, partial maps pass.
   Any existing saved draft with a partial `sectionVisibility` stays parseable.
3. **`heroBgUrl` / `heroCreativeTitle` carry `.default("")`.** They are plain `text()` (no `urlField`, as
   instructed), but the default keeps stored payloads written before these fields existed parseable and
   keeps the inferred output type `string`, which is what makes `ValidatedPortfolioData` satisfy
   `PortfolioData`. Output type is unchanged either way - the defaults only affect *input* leniency.
4. **`monthField` trim:** now `.trim()` (Zod v4) before `.regex()`, so `" 2024-01 "` is accepted and
   normalised, and `" 2024-13 "` is still rejected. Previously the trailing `.transform(trim)` was dead
   code and never fired.
5. **The `emptySectionIds` tests are characterisation tests, not red-green.** The twelve content
   predicates were already correct and were explicitly out of scope, so those three tests passed on
   first run. They lock the contract (all twelve when empty, eleven when only hero is filled, hero
   still empty when only the headline is filled) so the publish threshold cannot drift silently.
6. **`safeUrl` now rejects all C0 controls and DEL, not just tab/newline.** Deliberate: no legitimate
   URL contains raw control characters, and a partial blacklist is how the bypass got in the first place.
7. **`safeUrl` returns `""` (rejected) for control chars even in `http(s)://` URLs.** A URL with a raw
   newline in it is not something we want to keep, but if any legacy draft stores a pasted URL with an
   embedded newline it will now be dropped rather than trimmed. The `urlField` refinement treats that as
   a validation error, so the user sees a field error instead of silent data loss.

## Fix wave 3

**Branch:** `feature/portfolio-trust` (worktree `D:\ai-career-hub-portfolio-trust`).
**Final suite:** 84 passed / 9 files (`npm test`), `npx tsc --noEmit` clean, eslint clean on all 8 touched files.

### 1. Important — three date rules shared one misleading message

`src/lib/portfolio/schema.ts`: the boolean predicate `dateRange` is replaced by `dateRangeError`, which
returns *the reason it failed* (`string | null`) instead of `false`. The three rules now read
separately and each carries its own copy. `EndDateLabel` ("tanggal selesai" / "tanggal lulus") keeps the
experience/education wording that was already there, so the education message still says "tanggal lulus".

Both item schemas moved from `.refine(pred, { message })` to `.superRefine((v, ctx) => ...)` +
`ctx.addIssue({ code: "custom", message: reason })` — that is what makes a *per-rule* message possible;
a single `.refine` can only carry one static string.

| Condition | Message |
|---|---|
| `endDate` set, `startDate` empty | `Isi tanggal mulai dulu sebelum mengisi tanggal selesai` / `... tanggal lulus` |
| `isPresent` together with `endDate` | `Tanggal selesai tidak bisa diisi kalau ditandai masih berjalan` |
| `endDate < startDate` | `Tanggal selesai tidak boleh lebih awal dari tanggal mulai` |

Four tests now pin message **and** issue path (first time the suite pins paths):
`["experiences", 0]` / `["educations", 0]`, via a new `expectRejectedWith(payload, message, path)` helper
that asserts rejection, `error.issues[0].message`, and `error.issues[0].path`.

RED — old `schema.ts` stashed, new tests run (`git stash push -- src/lib/portfolio/schema.ts`):

```
  Tests  4 failed | 31 passed (35)

 FAIL  > memberi pesan sendiri saat tanggal selesai didahului tanggal mulai yang kosong
   AssertionError: expected 'Tanggal lulus tidak boleh lebih awal dari …' to be 'Isi tanggal mulai dulu sebelum mengis…'
 FAIL  > memberi pesan sendiri saat isPresentdisambiguation dengan tanggal selesai
   AssertionError: expected 'Tanggal selesai tidak boleh lebih awa…' to be 'Tanggal selesai tidak bisa diisi kala…'
 FAIL  > menolak section id yang tidak dikenal pada sectionColors      AssertionError: expected true to be false
 FAIL  > menolak alignment untuk section yang tidak dikenal           AssertionError: expected true to be false
```

The two date failures are the whole point of the finding: the old schema rejected both inputs, but
told the user their end date predates their start date when the actual problem was an empty start field
or a `isPresent` contradiction. GREEN: `Tests  35 passed (35)`.

The old two tests were *replaced*, not kept: `menolak isPresent yangdisambiguation…` (confounded — its
`endDate` was *earlier* than `startDate`, so it would pass even if the `isPresent` rule were deleted)
and `menolak tanggal selesai tanpa tanggal mulai` are now the message-pinning versions above. The
de-confounded `isPresent` fixture uses `startDate: "2024-01", endDate: "2025-06"` — in range, so only
the `isPresent` rule can reject it.

### 2. Important — `sectionVisibility` output type vs. real consumers

Consumer types widened, **schema untouched**. New shared alias in `src/components/portfolio/types.ts`:

```ts
export type SectionVisibility = Partial<Record<SectionId, boolean>>;
```

| File | Before | After |
|---|---|---|
| `src/components/portfolio/PortfolioCanvas.tsx:177` | `sectionVisibility: Record<SectionId, boolean>` | `sectionVisibility: SectionVisibility` |
| `src/components/portfolio/PublishedPortfolio.tsx:26` | `sectionVisibility?: Record<SectionId, boolean>` | `sectionVisibility?: SectionVisibility` |
| `src/app/p/[slug]/page.tsx:54` | `sectionVisibility?: Record<SectionId, boolean>` (inline) | `sectionVisibility?: SectionVisibility` |

`PortfolioCanvas` only ever truthiness-tests (`sectionVisibility[id]`, `!sectionVisibility[id]`,
`sectionVisibility[sid] && …`) and `PublishedPortfolio.isVisible` tests `!== false`, so a partial map
behaves identically at runtime. Both `PortfolioCanvasProps` and `PublishedPortfolioProps` are now
`export`ed so the test can name them.

Compile-time proof — the new test `sectionVisibility hasil parse langsung muat di tiga tipe konsumen`
assigns parsed output to all three consumer prop types. Temporarily re-tightening `PortfolioCanvas` to
`Record<SectionId, boolean>` makes `npx tsc --noEmit` fail on exactly that line:

```
src/__tests__/portfolio-schema.test.ts(513,7): error TS2322: Type 'Partial<Record<"hero" | … >>' is not
  assignable to type 'Record<"hero" | …, boolean>'.
  Types of property 'hero' are incompatible.
    Type 'boolean | undefined' is not assignable to type 'boolean'.
```

then passes again once reverted. No cast, no `as unknown as`.

### 3. Minor cleanups

- **`THEME_IDS` hoisted.** The tuple now lives in `src/components/portfolio/types.ts` next to
  `SECTION_IDS`, and `ThemeId` is derived: `export type ThemeId = (typeof THEME_IDS)[number];`.
  `schema.ts` imports it and re-exports (`export { THEME_IDS };`) so the existing
  `@/lib/portfolio/schema` import path keeps working — one definition, one source of truth.
- **Loose record keys tightened.** `sectionColors` → `z.partialRecord(z.enum(SECTION_IDS), z.record(z.string(), z.string()))`;
  `alignment` → `z.partialRecord(z.enum(SECTION_IDS), z.enum(["left","center","right"]))`. Two new tests
  (`…pada sectionColors`, `…untuk section yang tidak dikenal`) both RED above.
- **`.min(3)` deleted** from `slug`. It ran pre-trim on a different string than `isValidSlug`/`SLUG_REGEX`
  checks; `SLUG_REGEX` (`^[a-z0-9][a-z0-9-]{2,49}$`) is now the only length authority.
- **`portfolio-safety.ts`**: one comment added on the relative-path branch noting `esc()` output is
  HTML-attribute context and must not be handed to `fetch()` or CSS `url()`.
- **Control-char regex untouched.** `git diff src/lib/portfolio-safety.ts` is exactly `+2` comment lines;
  `/[\x00-\x1f\x7f\\]/` is byte-identical.

### Untouched, as instructed

The twelve `emptySectionIds` predicates; `urlField` still storing raw trimmed input; and both decisions
hold unchanged from wave 2.

### Verification before commit

```
$ npm test
  Test Files  9 passed (9)
      Tests  84 passed (84)
    Duration  4.51s

$ npx tsc --noEmit
(exit 0, no output)

$ npx eslint <8 touched files>
(exit 0, no output)
```

84 = 80 baseline − 2 replaced date tests + 6 new (3 date-message, 1 sectionColors, 1 alignment, 1 consumer-type).
Every pre-existing test still passes; none was weakened or edited.

### Database check — does rejecting `endDate` without `startDate` break stored rows?

**Answer: no. The dev database has zero `portfolio_pages` rows, so there is nothing to break.**
Queried the live dev DB from `D:\ai-career-hub\.env.local` (`DATABASE_URL`, `neondb` @ Neon
`ep-wispy-brook-…`, user `neondb_owner`) with the `postgres` driver via a throwaway script
(deleted afterwards, nothing added to the repo):

```
IDENTITY {"db":"neondb","usr":"neondb_owner","pages":0,"tbls":2,"users":18}
SCHEMAS  [{"nspname":"public"},{"nspname":"drizzle"}]
```

Both portfolio tables exist (`tbls: 2` — `portfolio_pages`, `portfolio_trial_uses`), so the zero is a
real empty table, not a missing one. The lateral-unnest queries over `data->experiences` and
`data->educations`:

```
TOTALS           {"pages":0,"with_exp":0,"with_edu":0}
OFFENDING ROWS   0   -- endDate non-empty, startDate empty
ISPRESENT+END    0
INVERTED ROWS    0
```

**Count: 0.** All three date rules therefore stay hard failures. If a production database with real
rows is in scope later, re-run the same query before enabling them there — the check is cheap, but it
is per-database, not a property of the schema.

### Concerns / deviations

1. **Scope deviation — `PublishedPortfolio.tsx` was edited although it was not on the list.** It was not
   optional: `p/[slug]/page.tsx` passes its local `sectionVisibility` straight into
   `<PublishedPortfolio>`, whose prop was `Record<SectionId, boolean>`. Widening only `page.tsx` would
   have left the same assignment broken one hop downstream, and the fix for that would have been a cast.
   The edit is one type, in the same direction, in the same consumer chain.
2. **`PublishDialog.tsx` needed a type change after all — but not the one expected.** Its
   `extras.sectionVisibility` is `Record<string, boolean>`, and `Partial<Record<SectionId, boolean>>` is
   already assignable to it: mapped types get an implicit index signature, interfaces do not. Verified
   with a standalone `npx tsc --strict` scratch file — the `Record<string, boolean>` line compiled, the
   `Record<SectionId, boolean>` line errored. So the file's *type* was left alone; the only change is
   `export` on `PublishDialogProps` so the test can assert against it. Net: **two** of the three named
   consumers actually needed widening, not three.
3. **`sectionColors` outer keys tightened, inner keys left loose.** The brief asked for the *inner*
   keys to become the section-id enum. That is not what the data model is: `ThemeDefinition.sectionColors`
   is `Partial<Record<SectionId, Partial<ThemeColors>>>`, so the **outer** map is keyed by section id
   (which is what `PortfolioCanvas.tsx:47` indexes with a `SectionId`) and the inner map is keyed by
   colour name (`primary`, `accent`, …). Constraining the inner map to section ids would reject every
   real value. The outer keys are now `z.enum(SECTION_IDS)`; inner keys stay `z.record(z.string(), z.string())`.
   Tightening the inner keys to a `ThemeColors` key enum is a reasonable follow-up, but it is a data
   restriction nobody asked for and it would reject legacy colour keys — not done unilaterally.
4. **`superRefine` issue path is `["experiences", 0]`, i.e. the item, not the field.** The rules are
   cross-field, so there is no single field to point at; a save flow that surfaces errors by field path
   will fall back to the item. If a later task needs `["experiences", 0, "endDate"]`, the helper has to
   grow a "which field is at fault" return instead of a message string.
5. **`sectionVisibility` is still `.optional()` in the schema**, so parsed output is
   `SectionVisibility | undefined`. `PortfolioCanvas` requires it non-undefined. The test narrows with a
   guard rather than `!` so the assertion stays cast-free, but the eventual `saveDraft` wiring will have
   to supply a default. Worth pinning in the task that does the wiring.
6. **The date messages are new user-facing copy** and have not been reviewed by anyone who writes
   Indonesian product copy. They are accurate and actionable as written; if the tone needs tuning, the
   four tests will point at exactly which strings move.

---

## Fix wave 4

Code-quality findings only. Spec compliance was already confirmed, and the twelve per-section
predicates in `emptySectionIds`, `urlField` storing raw trimmed input, and the
`/[\x00-\x1f\x7f\\]/` regex literal were all left alone as instructed.

### What changed

**New file `src/components/portfolio/sectionVisibility.ts`** -- the single rule for reading a partial
visibility map, extracted so editor and published page cannot drift again:

```ts
export const isSectionVisible = (visibility, id) => !visibility || visibility[id] !== false;
export const resolveVisibility = (order, visibility) => order.filter(id => isSectionVisible(visibility, id));
```

**Important 1 -- `PortfolioCanvas` read partial maps with the wrong semantics.**
All four bare-truthiness reads now go through the helper:
`PortfolioCanvas.tsx:209` (`visibleSections`), `:223` (dead `hidden` local, deleted), `:227`
(drag-end reorder), `:278` (child render gate). `PublishedPortfolio.tsx` was already correct; its
inline `isVisible` closure is replaced by a call to the same `resolveVisibility`, so the two now
share one implementation rather than two agreeing implementations.

`PortfolioCanvas.tsx:240-242` -- `visible: sectionVisibility[id as SectionId]` produced
`boolean | undefined` and laundered it through an `as Record<..., {visible: boolean}>` cast. The
value is now `isSectionVisible(...)` (an honest `boolean`), the map is built from `SECTION_IDS`
instead of `Object.entries(SECTION_META)` (which is why `id as SectionId` was needed at all), and
the target type is the shared `SectionConfig`. The remaining single `as Record<SectionId, SectionConfig>`
is a container cast, sound because `SECTION_IDS` enumerates exactly the keys -- it no longer hides
anything. The duplicated inline shape literal in `OrderContextType` is gone too.

**Important 2 -- `LiveData` widened.** `sectionVisibility: SectionVisibility` and
`alignment: Partial<Record<SectionId, TextAlignment>>`, and the interface is now exported so the
test can assert against it. Widening the interface surfaced a real second-order bug: `loadDraft`
poured an untrusted `JSON.parse` result straight into state typed as a complete record. Those two
setters now merge onto the complete defaults (`prev => ({ ...prev, ...draft.sectionVisibility })`),
which keeps the invariant that builder state is always complete while the *persisted* shape is
honestly partial.

**Important 3 -- `sectionColors` values format-checked.** `COLOR_PATTERN` accepts `#rgb`, `#rgba`,
`#rrggbb`, `#rrggbbaa` (case-insensitive), `rgb()`/`rgba()`/`hsl()`/`hsla()` with numeric or
percentage channels, and rejects everything else -- `var(...)`, `url(...)`, `expression(`, bare
words, malformed arities, and trailing injection attempts. Message: `Warna harus hex (#rgb atau
#rrggbb), rgb(), atau hsl()`.

**Important 4 -- both doc comments now describe what is true.** `MAX` no longer claims to mirror
form `maxLength` (only the three textareas carry one); `LIMITS` no longer claims form use (nothing
outside the schema and its test imports it). Both name the schema as the enforcing authority and
point at the later builder task. No `maxLength` was added to form inputs.

**Minor.**
- `contactEmail` and `contactPhone` now `.trim()` first, like `urlField` and `monthField`.
  `contactPhone` also gained the message `Nomor telepon tidak valid`, which it previously lacked --
  one line, and it makes the field match the Indonesian-message style of every other message in the
  file. Not requested; flagging it.
- `FONT_SIZES` hoisted to `types.ts`, `FontSize` derived from it. `schema.ts` `fontSize` and
  `live/page.tsx`'s font-size button row both use it, and `PortfolioCanvas.tsx`'s shadowing local
  `type FontSize` is deleted.
- The hero-name refine now attaches at `["data","formData","heroFirstName"]`. Zod 4 does allow it;
  the route is `.superRefine` + `ctx.addIssue({path})` rather than `.refine` params, because
  `.superRefine` is the pattern already used elsewhere in this file and gives an explicit path.

### Red-then-green evidence

All runs are `npx vitest run src/__tests__/portfolio-schema.test.ts` from the worktree root.

**Finding 1 -- revert `PortfolioCanvas.tsx` + `PublishedPortfolio.tsx` to HEAD, keep new tests:**

```
 ? src/__tests__/portfolio-schema.test.ts (66 tests | 1 failed)
 FAIL  ... > canvas dan halaman publik membaca peta parsial sama > canvas still
       renders a section missing from a partial visibility map
TestingLibraryElementError: Unable to find an element with the text: SEKSI_ABOUT.
 Test Files  1 failed (1)
      Tests  1 failed | 65 passed (66)
```

Exactly one failure, and it is the canvas. The `PublishedPortfolio` parity test passes on the old
code too -- correct, that side was already right. The bug is the disagreement, and it is now gone
because there is only one implementation.

**Findings 3 + minor trim + minor refine path -- revert `schema.ts` to HEAD, keep new tests:**

```
 ? src/__tests__/portfolio-schema.test.ts (66 tests | 13 failed)
 FAIL  ... > sectionColors > menolak var(--p-primary)
 FAIL  ... > sectionColors > menolak url(javascript:alert(1))
 FAIL  ... > sectionColors > menolak expression(alert(1))
 FAIL  ... > sectionColors > menolak biru
 FAIL  ... > sectionColors > menolak #ff
 FAIL  ... > sectionColors > menolak #fffffffff
 FAIL  ... > sectionColors > menolak rgb(1, 2)
 FAIL  ... > sectionColors > menolak hsl(210, 50%)
 FAIL  ... > sectionColors > menolak rgb(1,2,3); background: url(x)
 FAIL  ... > sectionColors > menolak dengan pesan yang menyebut format yang diterima
 FAIL  ... > field kontak > mem-trim spasi tepi pada contactEmail
 FAIL  ... > field kontak > mem-trim spasi tepi pada contactPhone
 FAIL  ... > pesan publish tanpa nama > menunjuk field yang salah, bukan akar payload
 Test Files  1 failed (1)
      Tests  13 failed | 53 passed (66)
```

**Finding 2 -- compile-time guard.** With `live/page.tsx` reverted and `LiveData` temporarily
exported, `npx tsc --noEmit`:

```
src/__tests__/portfolio-schema.test.ts(522,7): error TS2322: Type 'Partial<Record<"hero" | ... ,
    boolean>>' is not assignable to type 'Record<"hero" | ..., boolean>'.
src/__tests__/portfolio-schema.test.ts(541,49): error TS2322: Type 'Partial<Record<"hero" | ...,
    "left" | "center" | "right">>' is not assignable to type 'Record<"hero" | ..., TextAlignment>'.
```

A fourth consumer cannot silently disagree again: re-narrowing either field breaks the build.

### Final state

```
$ npm test
 Test Files  9 passed (9)
      Tests  115 passed (115)
   Duration  5.42s

$ npx tsc --noEmit
(no output)
```

84 -> 115 tests, all passing. The 84 pre-existing tests were never modified.

### Concerns

1. **Canvas rendering in jsdom works, so the helper is belt-and-braces.** I did not have to fall
   back to a helper-only test -- `PortfolioCanvas` renders under `@testing-library/react` with no
   stubbing at all. I extracted the helper anyway because the brief asked for it and because two
   components calling one function is a stronger structural guarantee than two passing tests. The
   `PublishedPortfolio` test does need `IntersectionObserver` and `matchMedia` stubs; those are
   test-local and clearly marked.
2. **`contactPhone` still restates its bound** (`MAX.phone` is 32, the regex says `{7,32}`). Fixing
   it needs the regex to interpolate `MAX.phone`, which is more code than the duplication costs and
   would make the regex harder to read. Left as-is.
3. **`TextAlignment`'s `["left","center","right"]` is still inline in `schema.ts`** and
   `TypographySettings.alignment` is still a complete `Record` in `types.ts`. Only the font-size
   tuple was hoisted, because only that one was named. Same drift, one line away.
4. **The colour regex is hand-rolled, not `CSS.supports`.** It has to run on the server and in
   jsdom, where `CSS.supports` does not exist, so it accepts exactly the listed notations and
   nothing more. It does not range-check channels (`rgb(999, 0, 0)` parses); that is a rendering
   concern rather than a safety one, and browser CSS already clamps it.
5. **`LiveData` is now exported from a page module.** That is a small widening of the module's
   surface purely so the compile-time assertion can name it. Moving it to a shared module would be
   cleaner but touches more files than this task scoped.
6. **`loadDraft` still `JSON.parse`s without any schema validation** -- the merge in this wave makes
   it *safe* for the partial-map fields, but it is still untyped-untrusted data feeding twelve
   state setters. Wiring `draftPayloadSchema` in here is the task this whole plan is building
   towards; this wave only clears the type obstacle.
7. **AGENTS.md asks whether antislop should run during or after this work.** It was not run. The
   only prose authored here is Indonesian doc comments inside existing files, matching surrounding
   style. Say the word if you want `antislop-code` over the comments before this lands.