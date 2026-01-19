-- Custom SQL migration file, put your code below! --

-- Add company_name column to providers table
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "company_name" text;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';