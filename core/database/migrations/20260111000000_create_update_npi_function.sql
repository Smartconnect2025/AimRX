-- Create a function to update NPI number directly (bypasses PostgREST schema cache)
CREATE OR REPLACE FUNCTION update_provider_npi(
  p_user_id UUID,
  p_npi_number TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE providers
  SET npi_number = p_npi_number,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_provider_npi(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION update_provider_npi IS 'Updates provider NPI number - workaround for PostgREST schema cache issues';
