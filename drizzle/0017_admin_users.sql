-- 0017: Admin yang dapat dikelola dari dashboard (tambahan dari ADMIN_EMAILS env).
-- Idempotent: aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(200) NOT NULL UNIQUE,
  "note" varchar(200),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Seed: pemilik aplikasi.
INSERT INTO "admin_users" ("email", "note")
VALUES ('rapih091017@gmail.com', 'Owner')
ON CONFLICT ("email") DO NOTHING;
