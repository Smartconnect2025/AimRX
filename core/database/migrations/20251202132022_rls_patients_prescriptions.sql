-- Custom SQL migration file, put your code below! --

-- Enable Row Level Security on patients and prescriptions tables
-- This ensures doctors can only see their own patients and prescriptions

-- Enable RLS on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on prescriptions table
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Grant table permissions to authenticated users (RLS will control actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE prescriptions TO authenticated;

-- Policy: Providers can only access their own patients (admins can see all)
DROP POLICY IF EXISTS "provider_patients_access" ON patients;
CREATE POLICY "provider_patients_access" ON patients
FOR ALL
TO authenticated
USING (
  auth.uid() = provider_id
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Policy: Providers can only access their own prescriptions (admins can see all)
DROP POLICY IF EXISTS "provider_prescriptions_access" ON prescriptions;
CREATE POLICY "provider_prescriptions_access" ON prescriptions
FOR ALL
TO authenticated
USING (
  auth.uid() = prescriber_id
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
