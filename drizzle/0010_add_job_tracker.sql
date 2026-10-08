-- Job Tracker: dua tabel baru untuk fitur pelacak lamaran (kanban).
-- Mengikuti pola migrasi manual proyek ini (0004_add_.. sampai 0009_..),
-- karena drizzle journal belum direkonsiliasi dengan file-file manual itu.

CREATE TABLE "job_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(60) NOT NULL,
	"color" varchar(20) DEFAULT 'slate' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tracked_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255),
	"location" text,
	"url" text,
	"description" text,
	"salary_note" varchar(120),
	"notes" text,
	"contact_name" varchar(120),
	"contact_info" varchar(255),
	"applied_at" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"cv_id" uuid,
	"cover_letter_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_stages" ADD CONSTRAINT "job_stages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tracked_jobs" ADD CONSTRAINT "tracked_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tracked_jobs" ADD CONSTRAINT "tracked_jobs_stage_id_job_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."job_stages"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tracked_jobs" ADD CONSTRAINT "tracked_jobs_cv_id_cv_documents_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cv_documents"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tracked_jobs" ADD CONSTRAINT "tracked_jobs_cover_letter_id_cover_letters_id_fk" FOREIGN KEY ("cover_letter_id") REFERENCES "public"."cover_letters"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "job_stages_user_id_idx" ON "job_stages" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "tracked_jobs_user_id_idx" ON "tracked_jobs" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "tracked_jobs_stage_id_idx" ON "tracked_jobs" USING btree ("stage_id");
