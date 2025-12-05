ALTER TABLE "prescriptions" ADD COLUMN "vial_size" text;
ALTER TABLE "prescriptions" ADD COLUMN "form" text;
ALTER TABLE "prescriptions" ADD COLUMN "dispense_as_written" boolean DEFAULT false;
ALTER TABLE "prescriptions" ADD COLUMN "pharmacy_notes" text;
ALTER TABLE "prescriptions" ADD COLUMN "patient_price" numeric(10, 2);
ALTER TABLE "prescriptions" ADD COLUMN "doctor_price" numeric(10, 2);