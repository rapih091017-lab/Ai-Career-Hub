-- 0015: Pengaturan situs (dapat diubah dari dashboard admin).
-- Idempotent: aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS "site_settings" (
  "key" varchar(100) PRIMARY KEY NOT NULL,
  "value" text,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
