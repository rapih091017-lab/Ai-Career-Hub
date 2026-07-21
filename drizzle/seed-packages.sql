CREATE TABLE IF NOT EXISTS "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"period_days" integer NOT NULL,
	"monthly" boolean DEFAULT false,
	"limits" jsonb,
	"badge" varchar(50),
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "packages_key_unique" UNIQUE("key")
);
