-- Add tier_level column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'tier_level'
  ) THEN
    ALTER TABLE "providers" ADD COLUMN "tier_level" text;
  END IF;
END $$;
