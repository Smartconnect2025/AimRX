-- Grant additional permissions for NPI functions to service_role
GRANT EXECUTE ON FUNCTION get_provider_npi(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_provider_npi(UUID, TEXT) TO service_role;

-- Also grant to anon for admin client access
GRANT EXECUTE ON FUNCTION get_provider_npi(UUID) TO anon;
GRANT EXECUTE ON FUNCTION update_provider_npi(UUID, TEXT) TO anon;
