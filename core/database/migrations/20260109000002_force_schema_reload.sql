-- Force reload PostgREST schema cache
-- This sends a notification to PostgREST to reload its schema cache

-- First, ensure the column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pharmacy_medications'
        AND column_name = 'aimrx_site_pricing_cents'
    ) THEN
        ALTER TABLE pharmacy_medications ADD COLUMN aimrx_site_pricing_cents INTEGER;
    END IF;
END $$;

-- Create a function to reload schema
CREATE OR REPLACE FUNCTION reload_postgrest_schema()
RETURNS void AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the reload
SELECT reload_postgrest_schema();
