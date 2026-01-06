-- Notify PostgREST to reload the schema cache
-- This ensures the API recognizes the tier_level column

NOTIFY pgrst, 'reload schema';

-- Also verify the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'tier_level'
  ) THEN
    RAISE NOTICE 'tier_level column exists in providers table';
  ELSE
    RAISE EXCEPTION 'tier_level column does NOT exist in providers table';
  END IF;
END $$;
