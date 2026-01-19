-- Call the reload function to force PostgREST to recognize company_name column
SELECT reload_postgrest_schema();

-- Wait a moment and call it again to be absolutely sure
SELECT pg_sleep(0.5);
SELECT reload_postgrest_schema();
