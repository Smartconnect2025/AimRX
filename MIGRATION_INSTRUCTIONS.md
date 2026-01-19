# Database Migration Required

## Issue
The `company_name` column needs to be added to the `providers` table, but automated migrations are not executing the SQL.

## Manual Migration Required

Please run the following SQL command directly in your Supabase SQL Editor:

```sql
-- Add company_name column to providers table
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Verify it was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'providers' AND column_name = 'company_name';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

## How to Run

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Paste the SQL above
5. Click **RUN**
6. Verify that the command returns the column information

## After Running

Once the SQL is executed, the provider invitation form will be able to save the company name, and it will display in the provider's profile.

## Files That Were Prepared

These files are ready and will work once the database column exists:
- `core/database/schema/providers.ts` - Schema definition updated
- `app/(features)/admin/doctors/page.tsx` - Form includes company name field
- `app/api/admin/invite-doctor/route.ts` - API saves company name
- `features/provider-profile/*` - Profile displays company name
