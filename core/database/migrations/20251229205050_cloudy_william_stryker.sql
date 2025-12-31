CREATE TABLE "access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"form_data" jsonb NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
