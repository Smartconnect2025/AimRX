ALTER TABLE "prescriptions" ADD COLUMN "medication_id" uuid;
ALTER TABLE "prescriptions" ADD COLUMN "pharmacy_id" uuid;
ALTER TABLE "prescriptions" ADD COLUMN "backend_id" uuid;
ALTER TABLE "prescriptions" ADD COLUMN "profit_cents" integer DEFAULT 0;
ALTER TABLE "prescriptions" ADD COLUMN "total_paid_cents" integer DEFAULT 0;
ALTER TABLE "prescriptions" ADD COLUMN "stripe_payment_intent_id" text;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medication_id_pharmacy_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."pharmacy_medications"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_backend_id_pharmacy_backends_id_fk" FOREIGN KEY ("backend_id") REFERENCES "public"."pharmacy_backends"("id") ON DELETE set null ON UPDATE no action;