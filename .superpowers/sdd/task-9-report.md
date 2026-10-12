# Task 9 Report: API aset + upload ke storage server

- **Status**: Completed
- **Commit SHA**: 93fc84d61c7ab183ce9be51b50d9024ab6806b5a
- **Test Summary**: `npm test` passed 15 test files (296 tests), `src/__tests__/portfolio-assets.test.ts` passed 6/6 tests.

## Completed Work
1. Created `src/lib/portfolio/assets.ts` exporting constants and image dimension helper functions (`readImageSize`, `isAllowedMime`, `fitsDimensionBudget`, `dimensionWarning`, `assetUrl`).
2. Implemented `POST /api/portfolio/assets` (`src/app/api/portfolio/assets/route.ts`) supporting 4MB upload limit, SHA-256 deduplication per user, image dimension reading, and DB storage in `portfolioAssets`.
3. Implemented `GET /api/portfolio/assets/[id]` (`src/app/api/portfolio/assets/[id]/route.ts`) serving image binary data for asset owners or references in published portfolio pages.
4. Created `PortfolioPhotoUpload` component (`src/components/portfolio/render/PortfolioPhotoUpload.tsx`) replacing base64 handling with server upload API.
5. Integrated `PortfolioPhotoUpload` into `src/app/portfolio/build/page.tsx` and `src/app/portfolio/live/page.tsx`.
6. Fixed asset access check to filter by `portfolioPages.status = 'published'` (Commit: 72ff562).
