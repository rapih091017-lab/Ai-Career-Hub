-- Riwayat LinkedIn Optimizer.
-- Satu baris = satu kali optimasi; full_result menyimpan skor per bagian dan
-- teks rewrite, jadi halaman hasil tidak memanggil model lagi.
CREATE TABLE IF NOT EXISTS "linkedin_optimizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anonymous_fingerprint" jsonb,
	"branding" text NOT NULL,
	"resume_text" text NOT NULL,
	"overall_score" integer NOT NULL,
	"grade" varchar(2) NOT NULL,
	"full_result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'linkedin_optimizations_user_id_users_id_fk'
	) THEN
		ALTER TABLE "linkedin_optimizations"
			ADD CONSTRAINT "linkedin_optimizations_user_id_users_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
