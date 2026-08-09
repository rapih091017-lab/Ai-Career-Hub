CREATE TABLE IF NOT EXISTS "portfolio_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" varchar(60) NOT NULL,
	"theme" varchar(50) DEFAULT 'glass' NOT NULL,
	"data" jsonb NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "portfolio_pages" ADD CONSTRAINT "portfolio_pages_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "portfolio_pages" ADD CONSTRAINT "portfolio_pages_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "portfolio_pages" ADD CONSTRAINT "portfolio_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
