import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log('Testing company_name column...\n');

  // Test 1: Try to select the column
  const { data, error } = await supabase
    .from('providers')
    .select('id, first_name, last_name, email, company_name')
    .limit(1);

  if (error) {
    console.log('❌ Column NOT accessible via PostgREST');
    console.log('Error:', error.message);
    console.log('\nAttempting to fix...\n');

    // Try to reload schema
    const { error: reloadError } = await supabase.rpc('reload_postgrest_schema');
    if (reloadError) {
      console.log('Schema reload error:', reloadError.message);
    } else {
      console.log('✅ Schema reload triggered');
    }

    // Wait and try again
    console.log('Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: data2, error: error2 } = await supabase
      .from('providers')
      .select('id, company_name')
      .limit(1);

    if (error2) {
      console.log('❌ Still not accessible:', error2.message);
    } else {
      console.log('✅ Now accessible!');
      console.log('Data:', data2);
    }
  } else {
    console.log('✅ company_name column is accessible!');
    console.log('Sample provider:', data);
  }
}

test().catch(console.error);
