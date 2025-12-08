CREATE TABLE "pharmacy_medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"name" text NOT NULL,
	"strength" text,
	"form" text,
	"ndc" text,
	"retail_price_cents" integer NOT NULL,
	"doctor_markup_percent" integer DEFAULT 25,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "pharmacy_medications" ADD CONSTRAINT "pharmacy_medications_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE no action ON UPDATE no action;