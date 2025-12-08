ALTER TABLE "pharmacy_medications" ADD COLUMN "in_stock" boolean DEFAULT true;
ALTER TABLE "pharmacy_medications" ADD COLUMN "preparation_time_days" integer DEFAULT 0;
ALTER TABLE "pharmacy_medications" ADD COLUMN "notes" text;