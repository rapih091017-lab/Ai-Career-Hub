# Task 10 Report: Migrasi 0023 + Siklus Publish & Portfolio Lifecycle

## Summary
- Created migration `0023_portfolio_pages_lifecycle.sql` and script `apply-0023-portfolio-pages-lifecycle.mjs` adding `status` (default `'draft'`) and `statusIdx` to `portfolioPages` table and dropping legacy `portfolioTrialUses`.
- Created helper `src/lib/portfolio/publish-gate.ts` (`canPublish`, `quotaMessage`, `PORTFOLIO_STATUS`, `UPGRADE_URL`).
- Added `maxActivePortfolios` support to `PackageDef` and `UserAccess` in `src/lib/access.ts` (Free: 1, Paid: 5).
- Rewrote `/api/portfolio/publish` (GET, POST, PATCH for archive, DELETE for permanent delete with `db.delete`).
- Updated `PublishDialog.tsx` to handle archive (`PATCH`), permanent delete (`DELETE` with confirmation modal), and quota status check.
- Added unit tests `src/__tests__/portfolio-publish-gate.test.ts`.

## Verification Results
- `npx vitest run src/__tests__/portfolio-publish-gate.test.ts`: PASS (5/5 tests)
- `npm test`: PASS (16 test files, 301/301 tests)
- `npx tsc --noEmit`: PASS (0 errors)
- Migration: Executed successfully via `node --env-file=.env scripts/apply-0023-portfolio-pages-lifecycle.mjs`

## Commit
`f1b921f` - `feat(portfolio): arsip menggantikan hapus, kuota portfolio aktif`
