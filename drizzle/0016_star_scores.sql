-- 0016: Riwayat skor STAR per user per pertanyaan (sinkron lintas perangkat).
-- Idempotent: aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS "star_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "question_id" varchar(80) NOT NULL,
  "score" numeric(3,2) NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE ("user_id", "question_id")
);
