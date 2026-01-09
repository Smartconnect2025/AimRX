ALTER TABLE "providers" ADD COLUMN "payment_details" jsonb;
ALTER TABLE "providers" ADD COLUMN "payment_method" text;
ALTER TABLE "providers" ADD COLUMN "payment_schedule" text;
ALTER TABLE "providers" ADD COLUMN "discount_rate" text;