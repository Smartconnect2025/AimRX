-- Final migration to ensure tier_level column exists
-- This handles all possible states of the column

DO $$
BEGIN
  -- Case 1: If commission_rate exists, rename it to tier_level
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE "providers" RENAME COLUMN "commission_rate" TO "tier_level";
    RAISE NOTICE 'Renamed commission_rate to tier_level';

  -- Case 2: If discount_rate exists, rename it to tier_level
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'discount_rate'
  ) THEN
    ALTER TABLE "providers" RENAME COLUMN "discount_rate" TO "tier_level";
    RAISE NOTICE 'Renamed discount_rate to tier_level';

  -- Case 3: If tier_level doesn't exist, create it
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers' AND column_name = 'tier_level'
  ) THEN
    ALTER TABLE "providers" ADD COLUMN "tier_level" text;
    RAISE NOTICE 'Created tier_level column';
  ELSE
    RAISE NOTICE 'tier_level column already exists';
  END IF;
END $$;
