-- Aggressive schema cache reload
-- This forces PostgREST to reload the schema cache

-- Verify column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'pharmacy_medications'
        AND column_name = 'aimrx_site_pricing_cents'
    ) THEN
        RAISE NOTICE 'Column aimrx_site_pricing_cents exists in pharmacy_medications';
    ELSE
        RAISE EXCEPTION 'Column aimrx_site_pricing_cents does NOT exist in pharmacy_medications';
    END IF;
END $$;

-- Force PostgREST to reload schema by sending multiple notifications
DO $$
BEGIN
    FOR i IN 1..5 LOOP
        PERFORM pg_notify('pgrst', 'reload schema');
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

-- Also try the reload config notification
DO $$
BEGIN
    PERFORM pg_notify('pgrst', 'reload config');
END $$;
