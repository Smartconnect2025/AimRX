ALTER TABLE "providers" ADD COLUMN "physical_address" jsonb;
ALTER TABLE "providers" ADD COLUMN "billing_address" jsonb;
ALTER TABLE "providers" ADD COLUMN "tax_id" text;
ALTER TABLE "patients" ADD COLUMN "physical_address" jsonb;
ALTER TABLE "patients" ADD COLUMN "billing_address" jsonb;