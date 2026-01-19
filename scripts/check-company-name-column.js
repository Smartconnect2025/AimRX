const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumn() {
  try {
    console.log('Checking if company_name column exists...');

    // Try to select company_name from providers
    const { data, error } = await supabase
      .from('providers')
      .select('id, first_name, last_name, company_name')
      .limit(1);

    if (error) {
      console.error('Error querying providers table:', error);
      console.log('\nColumn does NOT exist or is not accessible');

      // Try to add it directly
      console.log('\nAttempting to add company_name column...');
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE providers ADD COLUMN IF NOT EXISTS company_name TEXT;"
      });

      if (alterError) {
        console.error('Error adding column:', alterError);
      } else {
        console.log('Column added successfully!');

        // Reload schema
        console.log('Reloading schema...');
        await supabase.rpc('reload_postgrest_schema');
        console.log('Schema reloaded');
      }
    } else {
      console.log('✅ company_name column exists and is accessible!');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkColumn();
