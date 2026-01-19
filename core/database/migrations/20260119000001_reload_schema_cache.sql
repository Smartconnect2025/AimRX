-- Force reload of PostgREST schema cache to recognize company_name column
NOTIFY pgrst, 'reload schema';

-- Also ensure the column exists (in case migration order was off)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE providers ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- Final reload to be absolutely sure
NOTIFY pgrst, 'reload schema';
