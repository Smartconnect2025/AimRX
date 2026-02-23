-- ===================================================================
-- EMERGENCY MFA BYPASS SCRIPT
-- ===================================================================
-- Use this to disable MFA and clear verification codes when locked out
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Replace 'your-email@example.com' with your actual email
-- 4. Run this script
-- ===================================================================

-- Step 1: Find your user ID (replace with your email)
-- Uncomment the line below to find your user_id first:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Mark all MFA codes as used (prevents them from being verified)
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1
UPDATE mfa_codes
SET is_used = true
WHERE user_id = 'YOUR_USER_ID_HERE';

-- Step 3: Verify all codes are marked as used
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1
SELECT * FROM mfa_codes WHERE user_id = 'YOUR_USER_ID_HERE';

-- ===================================================================
-- ALTERNATIVE: Clear ALL MFA codes (use if you want a fresh start)
-- ===================================================================
-- Uncomment the line below to delete all MFA codes for your user:
-- DELETE FROM mfa_codes WHERE user_id = 'YOUR_USER_ID_HERE';

-- ===================================================================
-- OPTION 2: Create a valid MFA code manually (expires in 1 hour)
-- ===================================================================
-- Uncomment and run this to create a code you can use to log in:
-- INSERT INTO mfa_codes (user_id, code, expires_at, is_used)
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   '999999',  -- Use code: 999999 to log in
--   NOW() + INTERVAL '1 hour',
--   false
-- );
