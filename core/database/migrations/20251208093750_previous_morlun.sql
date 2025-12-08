CREATE TYPE "public"."pharmacy_system_type" AS ENUM('DigitalRx', 'PioneerRx', 'QS1', 'Liberty', 'Custom', 'BestRx');
CREATE TABLE "pharmacy_backends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacy_id" uuid NOT NULL,
	"system_type" "pharmacy_system_type" NOT NULL,
	"api_url" text,
	"api_key_encrypted" text,
	"store_id" text,
	"location_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "pharmacy_backends" ADD CONSTRAINT "pharmacy_backends_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE no action ON UPDATE no action;