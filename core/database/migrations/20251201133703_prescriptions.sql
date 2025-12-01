CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescriber_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"medication" text NOT NULL,
	"dosage" text NOT NULL,
	"quantity" integer NOT NULL,
	"refills" integer DEFAULT 0 NOT NULL,
	"sig" text NOT NULL,
	"pdf_base64" text,
	"signature_base64" text,
	"queue_id" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"tracking_number" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prescriptions_queue_id_unique" UNIQUE("queue_id")
);

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_prescriber_id_users_id_fk" FOREIGN KEY ("prescriber_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;