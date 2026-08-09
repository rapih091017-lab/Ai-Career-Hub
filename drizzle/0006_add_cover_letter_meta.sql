ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "letter_number" text;--> statement-breakpoint
ALTER TABLE "cover_letters" ADD COLUMN IF NOT EXISTS "attachment" text;
