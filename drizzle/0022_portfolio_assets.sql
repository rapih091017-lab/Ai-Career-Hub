-- 0022_portfolio_assets.sql
-- Aset gambar portfolio pindah dari base64 di dalam JSON ke tabel sendiri.
CREATE TABLE IF NOT EXISTS "portfolio_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "mime" varchar(32) NOT NULL,
  "bytes" integer NOT NULL,
  "width" integer,
  "height" integer,
  "sha256" varchar(64) NOT NULL,
  "data" bytea NOT NULL,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_assets_user_sha_idx"
  ON "portfolio_assets" ("user_id","sha256");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "portfolio_assets_user_idx"
  ON "portfolio_assets" ("user_id");
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_assets_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "portfolio_assets"
      ADD CONSTRAINT "portfolio_assets_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
