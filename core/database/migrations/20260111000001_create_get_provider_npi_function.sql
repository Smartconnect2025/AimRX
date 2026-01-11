-- Create a function to get provider NPI directly (bypasses PostgREST schema cache)
CREATE OR REPLACE FUNCTION get_provider_npi(p_provider_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT npi_number INTO result
  FROM providers
  WHERE id = p_provider_id;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_provider_npi(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_provider_npi IS 'Gets provider NPI number - workaround for PostgREST schema cache issues';
