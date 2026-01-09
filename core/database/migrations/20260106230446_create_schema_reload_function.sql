-- Create a function to reload PostgREST schema cache
-- This function can be called via RPC to force PostgREST to recognize new columns

CREATE OR REPLACE FUNCTION reload_postgrest_schema()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification to PostgREST to reload schema
  PERFORM pg_notify('pgrst', 'reload schema');
  
  RETURN 'Schema reload notification sent';
END;
$$;

-- Grant execute permission to authenticated users (admin will check permissions in the API route)
GRANT EXECUTE ON FUNCTION reload_postgrest_schema() TO authenticated;

-- Add comment
COMMENT ON FUNCTION reload_postgrest_schema() IS 'Sends notification to PostgREST to reload schema cache. Used when adding new columns to ensure API recognizes them immediately.';
