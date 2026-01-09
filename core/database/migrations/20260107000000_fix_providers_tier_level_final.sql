-- Final fix for tier_level column in providers table
-- This migration handles all possible states and ensures tier_level exists

DO $$
BEGIN
  -- Drop discount_rate if it exists (from previous migrations)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'discount_rate'
  ) THEN
    ALTER TABLE providers DROP COLUMN discount_rate;
    RAISE NOTICE 'Dropped discount_rate column';
  END IF;

  -- Drop commission_rate if it exists (from even earlier migrations)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE providers DROP COLUMN commission_rate;
    RAISE NOTICE 'Dropped commission_rate column';
  END IF;

  -- Drop tier_level if it exists (to recreate it cleanly)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'tier_level'
  ) THEN
    ALTER TABLE providers DROP COLUMN tier_level;
    RAISE NOTICE 'Dropped existing tier_level column';
  END IF;

  -- Create tier_level column fresh
  ALTER TABLE providers ADD COLUMN tier_level TEXT;
  RAISE NOTICE 'Created tier_level column';

  -- Add comment
  COMMENT ON COLUMN providers.tier_level IS 'Provider tier level set by admin (tier_1, tier_2, tier_3, tier_4) - each tier has different discount rates';

END $$;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
