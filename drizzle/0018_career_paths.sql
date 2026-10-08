-- 0018: Jalur karier (career path) per posisi, dikelola dari dashboard admin.
-- Idempotent: aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS "career_paths" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(80) NOT NULL UNIQUE,
  "role" varchar(120) NOT NULL,
  "category" varchar(80) NOT NULL,
  "summary" text,
  -- levels: [{ "level": "Junior", "years": "0-2 tahun", "salaryRange": "Rp4-7 juta", "focus": "..." }]
  "levels" jsonb,
  -- skills: ["React", "TypeScript", ...]
  "skills" jsonb,
  -- steps: ["...", "..."]
  "steps" jsonb,
  "is_published" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
