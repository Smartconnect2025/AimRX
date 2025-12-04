CREATE TABLE "medication_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medication_name" varchar(255) NOT NULL,
	"vial_size" varchar(100),
	"dosage_amount" varchar(50),
	"dosage_unit" varchar(20),
	"form" varchar(100),
	"quantity" varchar(50),
	"refills" varchar(10),
	"sig" text,
	"pharmacy_notes" text,
	"patient_price" numeric(10, 2),
	"doctor_price" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
