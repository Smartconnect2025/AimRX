-- Force reload schema cache for npi_number column
-- This ensures Supabase PostgREST recognizes the new column

-- Verify the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'providers'
    AND column_name = 'npi_number'
  ) THEN
    RAISE NOTICE '✓ npi_number column exists in providers table';
  ELSE
    RAISE EXCEPTION '✗ npi_number column does NOT exist - migration failed';
  END IF;
END $$;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
