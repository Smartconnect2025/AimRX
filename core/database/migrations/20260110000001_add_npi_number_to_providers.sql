-- Migration: Add npi_number column to providers table
-- This column stores the National Provider Identifier (10 digits)

-- Add npi_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'providers'
    AND column_name = 'npi_number'
  ) THEN
    ALTER TABLE public.providers
    ADD COLUMN npi_number TEXT;

    RAISE NOTICE 'Added npi_number column to providers table';
  ELSE
    RAISE NOTICE 'npi_number column already exists in providers table';
  END IF;
END $$;

-- Reload schema cache to ensure Supabase recognizes the new column
NOTIFY pgrst, 'reload schema';
