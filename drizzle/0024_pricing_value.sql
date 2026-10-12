-- 0024_pricing_value.sql
-- Perbaikan nilai paket (spec: pembeli terpelit karena paket tak masuk akal).
-- Idempotent: UPDATE kunci-berdasarkan, aman dijalankan berulang.
-- Perhatian: `limits` adalah jsonb penuh (bukan merge), jadi tulis lengkap.

-- 1. Trial Pro 3 hari (dulu identik dengan free tier).
UPDATE "packages"
SET "period_days" = 3,
    "name" = 'Coba Pro 3 Hari',
    "limits" = '{"ai_cv_generate":10,"cv_analyzer":3,"ai_revision":"unlimited","ai_suggestion":"unlimited","cover_letter":"unlimited","portfolio_web":false,"pdf_export":"unlimited","bulk_analyzer":false,"white_label":false}'::jsonb,
    "updated_at" = now()
WHERE "key" = 'cv_starter';

-- 2. Paket Portfolio 35rb membuktikan janji kartu pricing (AI portfolio + PDF).
UPDATE "packages"
SET "limits" = '{"ai_cv_generate":false,"cv_analyzer":false,"ai_revision":"unlimited","ai_suggestion":"unlimited","cover_letter":false,"portfolio_web":"unlimited","pdf_export":"unlimited","bulk_analyzer":false,"white_label":false}'::jsonb,
    "updated_at" = now()
WHERE "key" = 'portfolio_web';

-- 3. Bundel jadi "Paket Lamaran"; AI portfolio naik jadi unlimited.
UPDATE "packages"
SET "name" = 'Paket Lamaran',
    "limits" = '{"ai_cv_generate":"unlimited","cv_analyzer":1,"ai_revision":"unlimited","ai_suggestion":"unlimited","cover_letter":"unlimited","portfolio_web":"unlimited","pdf_export":"unlimited","bulk_analyzer":false,"white_label":false}'::jsonb,
    "updated_at" = now()
WHERE "key" = 'bundle_hemat';
