-- Bukti sosial dari pengguna nyata. Konten diisi admin lewat /admin/testimonials.
CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "role" varchar(100) NOT NULL,
  "text" varchar(600) NOT NULL,
  "avatar_url" text,
  "is_published" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "testimonials_published_order_idx"
  ON "testimonials" ("is_published", "sort_order", "created_at");
