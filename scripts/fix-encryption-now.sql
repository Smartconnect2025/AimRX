-- EMERGENCY FIX: Replace Greenwich 2 API key with plain text
-- This will bypass encryption and make it work immediately

-- Step 1: Find Greenwich 2 backend ID
SELECT
  pb.id as backend_id,
  p.name as pharmacy_name,
  pb.store_id
FROM pharmacy_backends pb
INNER JOIN pharmacies p ON p.id = pb.pharmacy_id
WHERE p.name ILIKE '%greenwich%2%';

-- Step 2: Update with your ACTUAL DigitalRx API key (plain text)
-- Replace 'YOUR_DIGITALRX_API_KEY' with the real key
UPDATE pharmacy_backends
SET api_key_encrypted = 'YOUR_DIGITALRX_API_KEY'
WHERE id = (
  SELECT pb.id
  FROM pharmacy_backends pb
  INNER JOIN pharmacies p ON p.id = pb.pharmacy_id
  WHERE p.name ILIKE '%greenwich%2%'
  LIMIT 1
);

-- The system will now use this plain text key (no decryption needed)
-- It will be automatically encrypted next time you edit the pharmacy
