ALTER TABLE "sessions" DROP CONSTRAINT "sessions_session_token_unique";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "expires_at" SET DATA TYPE integer USING "expires_at"::integer;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "sessions" ADD PRIMARY KEY ("session_token");
