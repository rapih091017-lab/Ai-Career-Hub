-- 0021_portfolio_drafts.sql
-- Draft portfolio pindah dari localStorage ke server.
CREATE TABLE IF NOT EXISTS "portfolio_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" varchar(120) DEFAULT 'Portfolio saya' NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_drafts_user_idx"
  ON "portfolio_drafts" ("user_id");
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_drafts_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "portfolio_drafts"
      ADD CONSTRAINT "portfolio_drafts_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
