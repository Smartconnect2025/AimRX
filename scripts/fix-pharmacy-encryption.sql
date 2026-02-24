-- ===================================================================
-- FIX PHARMACY API KEY ENCRYPTION ISSUE
-- ===================================================================
-- Use this to fix "Failed to decrypt API key" errors for pharmacies
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard (https://supabase.com)
-- 2. Navigate to SQL Editor
-- 3. Find your Greenwich 2 pharmacy ID by running the query below
-- 4. Replace the encrypted API key with a plain text key (temporarily)
-- 5. The system will re-encrypt it properly when you next edit the pharmacy
-- ===================================================================

-- Step 1: Find Greenwich 2 pharmacy and its backend
SELECT
  p.id as pharmacy_id,
  p.name as pharmacy_name,
  p.slug,
  pb.id as backend_id,
  pb.system_type,
  pb.store_id,
  pb.api_key_encrypted,
  pb.is_active
FROM pharmacies p
LEFT JOIN pharmacy_backends pb ON pb.pharmacy_id = p.id
WHERE p.name ILIKE '%greenwich%2%' OR p.slug ILIKE '%greenwich%2%'
ORDER BY p.created_at DESC;

-- ===================================================================
-- OPTION 1: Replace with your actual DigitalRx API key (RECOMMENDED)
-- ===================================================================
-- Replace 'PHARMACY_BACKEND_ID_HERE' with the backend_id from Step 1
-- Replace 'YOUR_ACTUAL_API_KEY_HERE' with your real DigitalRx API key

/*
UPDATE pharmacy_backends
SET api_key_encrypted = 'YOUR_ACTUAL_API_KEY_HERE'
WHERE id = 'PHARMACY_BACKEND_ID_HERE';
*/

-- ===================================================================
-- OPTION 2: Use the same API key as Greenwich 1 (for testing)
-- ===================================================================
-- This copies the API key from another pharmacy (useful for testing)

/*
UPDATE pharmacy_backends pb2
SET api_key_encrypted = (
  SELECT pb1.api_key_encrypted
  FROM pharmacy_backends pb1
  INNER JOIN pharmacies p1 ON p1.id = pb1.pharmacy_id
  WHERE p1.slug = 'grinethch' -- or 'aim' or whatever pharmacy has a working key
  LIMIT 1
)
WHERE pb2.id = 'PHARMACY_BACKEND_ID_HERE';
*/

-- ===================================================================
-- OPTION 3: Delete and re-create the backend (clean slate)
-- ===================================================================
-- This removes the broken backend so you can recreate it via the admin UI

/*
DELETE FROM pharmacy_backends
WHERE id = 'PHARMACY_BACKEND_ID_HERE';
*/

-- ===================================================================
-- VERIFY: Check if the fix worked
-- ===================================================================
SELECT
  p.name,
  pb.system_type,
  pb.store_id,
  LENGTH(pb.api_key_encrypted) as key_length,
  pb.is_active
FROM pharmacies p
LEFT JOIN pharmacy_backends pb ON pb.pharmacy_id = p.id
WHERE p.name ILIKE '%greenwich%2%';
