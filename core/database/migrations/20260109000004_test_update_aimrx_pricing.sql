-- Test updating existing records with aimrx_site_pricing_cents
-- This verifies the column works at the database level

DO $$
DECLARE
    test_record RECORD;
BEGIN
    -- Get first medication record
    SELECT id, name, retail_price_cents, aimrx_site_pricing_cents
    INTO test_record
    FROM pharmacy_medications
    LIMIT 1;

    IF FOUND THEN
        -- Try to update it with a test value
        UPDATE pharmacy_medications
        SET aimrx_site_pricing_cents = retail_price_cents + 1000
        WHERE id = test_record.id;

        RAISE NOTICE 'Successfully updated medication % with aimrx_site_pricing_cents', test_record.name;
    ELSE
        RAISE NOTICE 'No medications found to test';
    END IF;
END $$;

-- Force another schema reload
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
