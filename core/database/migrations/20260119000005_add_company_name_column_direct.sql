-- Directly add company_name column to providers table
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Verify column was added
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'providers'
    AND column_name = 'company_name'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE 'company_name column exists in providers table';
  ELSE
    RAISE EXCEPTION 'Failed to add company_name column to providers table';
  END IF;
END $$;
