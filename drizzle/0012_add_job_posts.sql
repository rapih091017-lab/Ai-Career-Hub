-- 0012: Job posts untuk halaman /karir (dikelola admin lewat /admin/jobs).
-- Idempotent: aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS "job_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(200) NOT NULL,
  "company" varchar(200),
  "location" varchar(200),
  "description" text,
  "apply_url" text NOT NULL,
  "image_url" text,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
