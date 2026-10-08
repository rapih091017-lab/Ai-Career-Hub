-- 0014: Data rekening bank untuk pencairan komisi affiliate.
-- Idempotent: aman dijalankan berulang.

ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "bank_name" varchar(100);
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "bank_account_number" varchar(50);
ALTER TABLE "affiliates" ADD COLUMN IF NOT EXISTS "bank_account_holder" varchar(150);
