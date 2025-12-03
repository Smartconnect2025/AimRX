-- Add structured dosage fields to prescriptions table
-- This allows medical-grade data entry with separate amount and unit fields

ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS dosage_amount TEXT,
ADD COLUMN IF NOT EXISTS dosage_unit TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN prescriptions.dosage_amount IS 'Numeric dosage amount (e.g., "10", "20.5")';
COMMENT ON COLUMN prescriptions.dosage_unit IS 'Dosage unit (e.g., "mg", "mL", "mcg", "g", "units", "%")';
COMMENT ON COLUMN prescriptions.dosage IS 'Legacy combined dosage field (e.g., "10mg") - kept for backward compatibility';
