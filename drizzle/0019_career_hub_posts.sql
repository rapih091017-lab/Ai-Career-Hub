-- Career Hub educational posts. DOCX/PDF imports remain a future phase.
CREATE TABLE IF NOT EXISTS "career_hub_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(180) NOT NULL UNIQUE,
  "title" varchar(180) NOT NULL,
  "excerpt" varchar(500) NOT NULL,
  "content" text NOT NULL,
  "cover_image_url" text,
  "category" varchar(60) NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" varchar(12) DEFAULT 'draft' NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "career_hub_posts_status_check" CHECK ("status" IN ('draft', 'published'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "career_hub_posts_status_published_idx"
  ON "career_hub_posts" USING btree ("status", "published_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "career_hub_posts_category_status_published_idx"
  ON "career_hub_posts" USING btree ("category", "status", "published_at");
