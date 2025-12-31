import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function approveRequest() {
  const email = 'hafsah+2@topflightapps.com';

  // Find the access request
  const { data: request, error: findError } = await supabase
    .from('access_requests')
    .select('*')
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (findError) {
    console.error('Error finding request:', findError);
    return;
  }

  if (!request) {
    console.log('No pending access request found for', email);
    return;
  }

  console.log('Found request:', request.id);

  // Update to approved
  const { error: updateError } = await supabase
    .from('access_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', request.id);

  if (updateError) {
    console.error('Error updating request:', updateError);
    return;
  }

  console.log('✅ Successfully approved access request for', email);
}

approveRequest();
