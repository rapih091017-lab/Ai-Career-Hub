-- Klasifikasi lowongan: kategori rekrutmen, tipe kerja, dan batas akhir.
-- Nullable semua supaya lowongan lama tetap tampil tanpa perlu diisi ulang.
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "job_type" varchar(12);
--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "employment_type" varchar(20);
--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "deadline" timestamp;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_posts_job_type_check'
  ) THEN
    ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_job_type_check"
      CHECK ("job_type" IS NULL OR "job_type" IN ('staff', 'mt', 'odp'));
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_posts_employment_type_check'
  ) THEN
    ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_employment_type_check"
      CHECK (
        "employment_type" IS NULL OR
        "employment_type" IN ('full_time', 'part_time', 'internship')
      );
  END IF;
END $$;