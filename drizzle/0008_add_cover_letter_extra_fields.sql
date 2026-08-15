ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "job_source" text;--> statement-breakpoint
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "company_address" text;--> statement-breakpoint
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "motivation_reason" text;--> statement-breakpoint
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "future_plan" text;
