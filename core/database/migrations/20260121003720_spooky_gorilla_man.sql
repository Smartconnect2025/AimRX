ALTER TABLE "payment_credentials" DISABLE ROW LEVEL SECURITY;
DROP TABLE "payment_credentials" CASCADE;
ALTER TABLE "payment_transactions" ADD COLUMN "authnet_ref_id" text;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_authnet_ref_id_unique" UNIQUE("authnet_ref_id");