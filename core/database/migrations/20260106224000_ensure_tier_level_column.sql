-- Ensure tier_level column exists by checking what currently exists and migrating appropriately
DO $$
BEGIN
  -- If commission_rate exists, rename it to tier_level
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE "providers" RENAME COLUMN "commission_rate" TO "tier_level";
  -- If discount_rate exists, rename it to tier_level
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'discount_rate'
  ) THEN
    ALTER TABLE "providers" RENAME COLUMN "discount_rate" TO "tier_level";
  -- If neither exists, create tier_level
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'tier_level'
  ) THEN
    ALTER TABLE "providers" ADD COLUMN "tier_level" text;
  END IF;
END $$;
