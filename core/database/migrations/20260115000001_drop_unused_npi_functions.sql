-- Drop unused NPI workaround functions that are no longer needed
-- These were created to bypass PostgREST schema cache issues which have been resolved
-- The code now uses direct column access (provider.npi_number) instead of RPC calls

DROP FUNCTION IF EXISTS get_provider_npi(UUID);
DROP FUNCTION IF EXISTS update_provider_npi(UUID, TEXT);
DROP FUNCTION IF EXISTS reload_postgrest_schema();
