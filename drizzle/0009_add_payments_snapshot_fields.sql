ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "package_name" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "limits" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "redirect_url" text;