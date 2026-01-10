-- Aggressive schema cache reload for npi_number column
-- Force PostgREST to recognize the new npi_number column

-- Verify column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'providers'
    AND column_name = 'npi_number'
  ) THEN
    RAISE NOTICE '✓ npi_number column EXISTS in providers table';
  ELSE
    RAISE EXCEPTION '✗ npi_number column MISSING - need to run migration first!';
  END IF;
END $$;

-- Multiple reload attempts
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Brief pause
SELECT pg_sleep(0.5);

-- Reload again
NOTIFY pgrst, 'reload schema';

RAISE NOTICE '✓ Schema cache reload commands sent - wait 30-60 seconds for PostgREST to refresh';
