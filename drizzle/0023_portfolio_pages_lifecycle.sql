-- 0023_portfolio_pages_lifecycle.sql
-- Archive menggantikan hapus: slug dan data tidak hilang.
ALTER TABLE "portfolio_pages"
  ADD COLUMN IF NOT EXISTS "status" varchar(16) DEFAULT 'draft' NOT NULL;

UPDATE "portfolio_pages" SET "status" = 'published' WHERE "published_at" IS NOT NULL;
UPDATE "portfolio_pages" SET "status" = 'draft'     WHERE "published_at" IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'portfolio_pages_status_idx') THEN
    CREATE INDEX "portfolio_pages_status_idx" ON "portfolio_pages" USING btree ("status");
  END IF;
END $$;

DROP TABLE IF EXISTS "portfolio_trial_uses";
