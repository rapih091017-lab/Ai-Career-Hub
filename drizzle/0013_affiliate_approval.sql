-- 0013: Approval program affiliate (daftar dulu, admin menyetujui).
-- Idempotent: aman dijalankan berulang. Baris lama (dibuat sebelum fitur
-- approval ada) otomatis disetujui agar kode yang sudah beredar tetap aktif.

ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'pending' NOT NULL;
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "application_note" text;
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;

UPDATE "affiliates" SET "status" = 'approved', "approved_at" = now()
WHERE "status" = 'pending' AND "created_at" < now();
