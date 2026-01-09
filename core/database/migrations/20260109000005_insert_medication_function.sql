-- Create a function to insert medications with both pricing fields
-- This bypasses PostgREST schema cache issues
CREATE OR REPLACE FUNCTION insert_pharmacy_medication(
  p_pharmacy_id UUID,
  p_name TEXT,
  p_strength TEXT,
  p_vial_size TEXT,
  p_form TEXT,
  p_ndc TEXT,
  p_retail_price_cents INTEGER,
  p_aimrx_site_pricing_cents INTEGER,
  p_doctor_markup_percent INTEGER,
  p_category TEXT,
  p_dosage_instructions TEXT,
  p_detailed_description TEXT,
  p_is_active BOOLEAN,
  p_in_stock BOOLEAN,
  p_preparation_time_days INTEGER,
  p_notes TEXT
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO pharmacy_medications (
    pharmacy_id,
    name,
    strength,
    vial_size,
    form,
    ndc,
    retail_price_cents,
    aimrx_site_pricing_cents,
    doctor_markup_percent,
    category,
    dosage_instructions,
    detailed_description,
    is_active,
    in_stock,
    preparation_time_days,
    notes
  ) VALUES (
    p_pharmacy_id,
    p_name,
    p_strength,
    p_vial_size,
    p_form,
    p_ndc,
    p_retail_price_cents,
    p_aimrx_site_pricing_cents,
    p_doctor_markup_percent,
    p_category,
    p_dosage_instructions,
    p_detailed_description,
    p_is_active,
    p_in_stock,
    p_preparation_time_days,
    p_notes
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
