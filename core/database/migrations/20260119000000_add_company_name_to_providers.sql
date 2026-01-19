-- Add company_name column to providers table
ALTER TABLE providers ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Reload schema cache to ensure PostgREST picks up the new column
NOTIFY pgrst, 'reload schema';
