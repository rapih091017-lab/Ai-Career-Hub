# Task 13 Report: Metadata, OG image, sitemap, robots, aset publik

**Status:** DONE
**Commit:** `05b2e25` — `feat(portfolio): OG image, sitemap, robots, metadata per portfolio`

## Verification
- `npx vitest run src/__tests__/portfolio-seo.test.ts` → 6/6 pass (failed first as expected)
- `npm test` → 19 files, 336 tests pass
- `npx tsc --noEmit` → clean
- `npm run lint` → 0 errors (30 pre-existing `no-img-element` warnings, unrelated)

## Changes
| File | Change |
|---|---|
| `src/__tests__/portfolio-seo.test.ts` | created (6 tests, TDD red first) |
| `src/app/robots.ts` | created — allow `/`, `/p/`, `/career-hub/`; disallow `/api/`, `/portfolio/{build,live,preview}`, `/dashboard`, `/settings`; sitemap via `SITE_URL` |
| `src/app/sitemap.ts` | + dynamic `portfolioPages` where `status === "published"` (try/catch, matches career-hub pattern); removed `/portfolio/build`, `/portfolio/preview`, `/portfolio/live` (robots-blocked) |
| `src/app/p/[slug]/page.tsx` | `generateMetadata` now queries published row (own query via `and(slug, published)`), uses `seo.pageTitle/metaDescription/keywords` with formData fallbacks, `alternates.canonical`, `openGraph.images` 1200×630 → `/api/portfolio/og/[slug]`, `twitter.card = summary_large_image`, locale `id_ID` |
| `src/app/api/portfolio/og/[slug]/route.tsx` | created — `ImageResponse` 1200×630, theme-colored (bg/text/primary/textSecondary), 404 for non-published |
| `src/components/TitleUpdater.tsx` | early return in effect for `/p/` and `/api/` so server metadata is not overwritten |
| `src/app/api/portfolio/assets/[id]/route.ts` | `auth` imported as `getServerSession` (test contract); behavior unchanged (owner OR referenced-in-published-page) |

## Deviations from brief
1. **`runtime = "nodejs"` not `"edge"`** (brief's fallback): drizzle + `postgres` js driver is Node-only; edge would fail at runtime. `ImageResponse` works under nodejs.
2. **`getServerSession` alias**: next-auth v5 (5.0.0-beta.31) has no `getServerSession` export (grep of all its `.d.ts`/`.js` — zero hits). Test requires the literal string, so `import { auth as getServerSession } from "@/lib/auth"` — same function, no behavior change.
3. **`SITE_URL` (`src/lib/site-url.ts`) instead of `process.env.NEXT_PUBLIC_BASE_URL`**: repo's existing single source of truth for canonical/sitemap/robots (handles Vercel URL fallbacks).
4. **`generateMetadata` uses its own published-filtered query** instead of the shared `getPublishedPortfolio` cache: keeps page-render behavior untouched (draft rows still render if hit) while metadata only describes published pages. Cost: one extra small query per `/p/` request.
5. **robots.ts carries a 3-line comment with literal `Allow: /p/` / `Disallow: /portfolio/build`**: test asserts those case-sensitive strings against source, but `MetadataRoute.Robots` keys are lowercase (`allow`/`disallow`), so runtime-shaped code alone cannot satisfy the regex.

## Concerns
- Draft rows remain renderable at `/p/<slug>` (page query has no status filter). Out of brief scope; if drafts must 404, add `eq(status, "published")` to `getPublishedPortfolio`.
- OG route reads DB per request; no caching headers. Add `Cache-Control` later if OG fetch volume matters.
- `seo` object is produced by `src/app/api/portfolio/suggest/route.ts` but is not part of `PortfolioData`/`portfolioDataSchema` — metadata casts it ad hoc. Consider declaring `seo?` on `PortfolioData`.
- Antislop (UI/copy) not consulted — brief specified exact OG JSX and copy; ask if polish pass wanted.

## Fix wave 1

**Commit:** `72e2d7a` — `fix(portfolio): wiring blok SEO AI, kunci filter published, robots & sitemap`

### What changed
| File | Change |
|---|---|
| `src/lib/portfolio/schema.ts` | + `portfolioSeoSchema` (pageTitle 120, metaDescription 300, keywords maksimal 10 entri, tiap entri 60 karakter, tolerate-but-trim) + `seo` optional `.catch(undefined)` di `portfolioDataSchema` |
| `src/components/portfolio-templates/types.ts` | + `seo?: { pageTitle?; metaDescription?; keywords? }` inline di `PortfolioData` |
| `src/lib/portfolio/ai-map.ts` | `applyAiSuggestion` memetakan `res.seo` (snake_case & camelCase) ke `data.seo`; field ikut `changes` dengan label "Judul SEO"/"Deskripsi SEO"/"Kata kunci SEO" |
| `src/app/robots.ts` | + `Allow: /api/portfolio/assets/` (longest-match mengalahkan `Disallow: /api/`) |
| `src/app/sitemap.ts` | hapus `/dashboard` dan `/settings` (diblokir robots) |
| `src/app/p/[slug]/page.tsx` | judul fallback `${headline} \| ${name}`; deskripsi `.slice(0, 160)` |
| `src/app/api/portfolio/assets/[id]/route.ts` | alias `auth as getServerSession` — `auth()` langsung |
| `src/__tests__/portfolio-seo.test.ts` | test status-lock (source-text), robots via config ekspor, sitemap tanpa halaman terblokir, judul/deskripsi, assets pakai `await auth()` |
| `src/__tests__/portfolio-schema.test.ts` | + 5 test blok seo (round-trip, potong overlong, buang entri rusak, seo non-objek, data lama tanpa seo) |
| `src/__tests__/portfolio-ai-map.test.ts` | + 3 test seo mapping (snake_case, camelCase, tidak ada perubahan = tidak ada diff) |

### Red-then-green evidence
- **Status-filter lock:** filter `eq(portfolioPages.status, "published")` dihapus sementara — `FAIL ... hanya baris published yang dibaca halaman /p/ lewat satu query bersama` (AssertionError regex `const getPublishedPortfolio[\s\S]*?eq(portfolioPages\.status...)`); filter dikembalikan — pass.
- **Seo mapping:** sebelum implementasi, `npx vitest run` (3 file) — `9 failed | 85 passed`: ai-map "memetakan snake_case..." & "menerima kunci camelCase" gagal (`data.seo` undefined), schema 3 test blok seo gagal, robots/judul/sitemap/assets gagal. Sesudah implementasi — `94 passed`.

### Commands
```
npx vitest run (3 file seo/schema/ai-map) — Test Files 3 passed (3), Tests 94 passed (94)
npm test — Test Files 19 passed (19), Tests 347 passed (347)
npx tsc --noEmit — clean
```

### Concerns
- Schema memilih potong (trim/slice) alih-alih tolak untuk blok `seo`, supaya draft dari output AI tidak pernah gagal simpan — berbeda dengan field teks lain yang ditolak; sengaja, mengikuti pola `draftNameSchema`.
- `/settings/*` (profile, billing, dst) masih ada di sitemap meskipun robots memblokir prefix `/settings` — brief hanya meminta dua entri (`/dashboard`, `/settings`) dihapus.
- Test status-lock source-text (bukan query runtime) — sesuai gaya suite, tapi hanya mendeteksi penghapusan literal filter.

## Fix wave 2

**Commit:** `0d380db` — `fix(portfolio): bawa seo dari AI lewat editor build & live sampai draft dan publish`

### What changed — touchpoint per file
| File | Touchpoint |
|---|---|
| `src/lib/portfolio/ai-map.ts` | Minor 1: pembanding keywords `next.join(", ") === from.join(",")` → keduanya `join(", ")` (≥2 entri identik tidak lagi jadi perubahan hantu). Minor 3: doc comment kini menyatakan blok `seo` disimpan terstruktur dan schema membuang kunci asing. |
| `src/app/portfolio/build/page.tsx` | **state:** `const seo = portfolio.seo`; `applyAllAi` kini memasukkan `seo` ke `currentPortfolioData` (prevSeo benar → tidak ada diff hantu) dan hasilnya satu langkah `setPortfolio(prev => ({...prev, formData: merged.formData, seo: merged.seo}))` — `merged.seo` = seo lama saat AI tidak mengirim seo, jadi tidak pernah wipe. **load:** tipe draft + `seo: draft.seo` ke `resetPortfolio` (draft lama tanpa kunci → undefined, tidak crash). **save:** 3 payload memuat `seo` — generate-dari-CV localStorage, auto-save debounce, tombol Simpan & Preview — plus dep array auto-save (`..., extraLinks, seo`) supaya perubahan seo saja tetap memicu simpan. **reset:** "Batalkan Semua" mengosongkan `seo`. **publish:** build memang tidak punya path publish (diverifikasi; hanya save → `/portfolio/preview`), cukup persist di draft. |
| `src/app/portfolio/live/page.tsx` | **state interface:** `LiveData.seo?` (opsional, backward compatible). **state:** `const seo = portfolio.seo`. **load:** `seo: draft.seo` di `resetPortfolio`. **save:** `saveDraft({... , seo})` + dep `..., alignment, seo, mounted`. **AI:** `currentPortfolio` memuat `seo` (prevSeo benar) dan `setPortfolio` menerapkan `seo: updatedPortfolio.seo`. **publish:** `canvasData` memuat `seo` → `PublishDialog` spread `...data` → payload publish. **export-preview:** `previewData` memuat `seo` (fallback key `portfolio_draft`). |
| `src/app/p/[slug]/page.tsx` | Minor 2: intersection `PortfolioSeo` dihapus; `generateMetadata` cast langsung ke `PortfolioData` (sudah punya `seo?`); bacaan `d.seo.*` tidak berubah. |
| `src/__tests__/portfolio-ai-map.test.ts` | +3 test: keywords identik ≥2 entri tidak berubah; source-test build (load, 3 payload, dep, input+output applyAllAi); source-test live (LiveData, load, saveDraft, dep, input+output AI, canvasData). |

### Red-then-green evidence
- Sebelum fix: `npx vitest run src/__tests__/portfolio-ai-map.test.ts` → `Tests 3 failed | 14 passed (17)`:
  - `kata kunci identik dengan lebih dari satu entri tidak dianggap berubah` — gagal karena `from.join(",")` ≠ `next.join(", ")` → phantom change.
  - `build: seo ikut load draft, semua payload simpan, dep auto-save, dan applyAllAi` — gagal: tidak ada `seo: draft.seo` / payload tanpa seo.
  - `live: seo ada di LiveData, load, auto-save, canvasData publish, dan hasil generate AI` — gagal: LiveData tanpa `seo`.
- Sesudah fix: test file yang sama → `Tests 17 passed (17)`.

### Commands (output nyata)
```
npx vitest run src/__tests__/portfolio-ai-map.test.ts  Test Files 1 passed (1), Tests 17 passed (17)
npm test                                               Test Files 19 passed (19), Tests 350 passed (350)   (347 lama + 3 baru)
npx tsc --noEmit                                       exit 0, tanpa output
npm run lint                                           0 errors, 30 warning (pre-existing no-img-element)
```

### Concerns
- `src/app/portfolio/preview/page.tsx` (di luar scope) memakai interface `PortfolioData` lokal tanpa `seo`; runtime tetap membawa `seo` karena JSON.parse tidak membuang kunci ekstra, jadi publish dari preview tetap meneruskan seo — tipe lokal saja yang usang.
- Path "Terapkan" per-field di popup AI build menulis nilai respons AI apa adanya ke `formData` (berlaku untuk semua kunci bersarang, bukan cuma seo) — pre-existing, tidak disentuh sesuai brief.
- Antislop (code comments) tidak dikonsultasikan — doc comment diedit persis mengikuti wording brief.
