-- Add aimrx_site_pricing_cents column to pharmacy_medications table
ALTER TABLE pharmacy_medications
ADD COLUMN IF NOT EXISTS aimrx_site_pricing_cents INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN pharmacy_medications.aimrx_site_pricing_cents IS 'AIMRx site pricing (what AIMRx charges customers) in cents';
