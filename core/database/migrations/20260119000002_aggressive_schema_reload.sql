-- Aggressive schema cache reload for company_name column
-- This ensures PostgREST recognizes the new column

-- Verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'providers'
    AND column_name = 'company_name'
  ) THEN
    RAISE EXCEPTION 'company_name column does not exist in providers table';
  ELSE
    RAISE NOTICE 'company_name column exists in providers table';
  END IF;
END $$;

-- Force PostgREST schema cache reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Also invalidate any cached schema information
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
