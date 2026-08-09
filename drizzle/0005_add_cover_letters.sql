CREATE TABLE IF NOT EXISTS "cover_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cv_id" uuid,
	"job_title" text,
	"company_name" text,
	"recipient_name" text,
	"language" varchar(5) DEFAULT 'id' NOT NULL,
	"style" varchar(20) DEFAULT 'formal' NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_cv_id_cv_documents_id_fk" FOREIGN KEY ("cv_id") REFERENCES "cv_documents"("id") ON DELETE set null;
