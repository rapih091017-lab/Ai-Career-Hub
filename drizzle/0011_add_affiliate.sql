-- 0011: Program affiliate (kode referral, klik, konversi) + kolom atribusi di payments.
-- Idempotent: aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "code" varchar(30) NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "referral_clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE,
  "landing" varchar(120),
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "referral_clicks_affiliate_id_idx" ON "referral_clicks" ("affiliate_id");

CREATE TABLE IF NOT EXISTS "referral_conversions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE,
  "referred_user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "payment_id" uuid REFERENCES "payments"("id") ON DELETE SET NULL,
  "reward_amount" integer NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "paid_at" timestamp
);
CREATE INDEX IF NOT EXISTS "referral_conversions_affiliate_id_idx" ON "referral_conversions" ("affiliate_id");

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "referral_code" varchar(30);
