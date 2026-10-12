# Task 12 Report: Export HTML dari Renderer yang Sama

## Status
Completed

## Commit SHA
6d1584a

## Summary
- Replaced `generateExportHtml` with `buildHtmlDocument` and `inlineAssets` in `src/lib/portfolio/export-html.ts`.
- Implemented `GET /api/portfolio/export?draftId=&theme=` endpoint in `src/app/api/portfolio/export/route.ts`.
- Updated `src/app/portfolio/preview/page.tsx` export button to trigger `/api/portfolio/export`.
- Created unit tests in `src/__tests__/portfolio-export.test.ts`.

## Test Summary
18 test files passed (320 tests total, 8 in portfolio-export.test.ts).

## Concerns
None.

## Fix wave 1 (dikerjakan controller)
- Critical: draftId kini dari API draft server (GET terbaru, PATCH sync data preview / POST bila belum ada); sumber mati ?draftId=/portfolio_draft_id dihapus.
- exportError dirender dengan role=alert; kunci i18n preview.exporting / export-error / export-error-save ditambahkan.
- Route: draftId opsional (fallback terbaru), Object.hasOwn(THEMES), meneruskan sectionOrder/sectionVisibility/fontSize.
- export-html: pakai esc() dari portfolio-safety (escTitle duplikat dihapus), collectAssetIds + swap mencakup companyLogo.
- portfolio-safety: komentar baseline yang sudah basi diperbarui.
- Test: 8 test pengunci ditambahkan (16 di file export). Verifikasi: 328/328 lulus, tsc bersih, commit 872e779.

## Fix wave 2 (controller)
- fontSize masuk portfolioDataSchema + PortfolioData (opsional), sehingga round-trip lewat API draft dan export membawa ukuran font pilihan user. Route memakai parsed.data.fontSize; query-param helper dihapus. Test: 330/330 lulus, tsc bersih.
