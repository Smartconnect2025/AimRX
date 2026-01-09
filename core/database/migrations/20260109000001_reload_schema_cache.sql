-- Reload PostgREST schema cache to recognize new column
NOTIFY pgrst, 'reload schema';
