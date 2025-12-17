/**
 * Seed Test Prescriptions
 *
 * Creates sample prescriptions for testing the pharmacy admin incoming queue
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MEDICATIONS = [
  { name: 'Semaglutide', dosage: '2.5mg', form: 'Injection' },
  { name: 'Tirzepatide', dosage: '5mg', form: 'Injection' },
  { name: 'Metformin', dosage: '500mg', form: 'Tablet' },
  { name: 'Lisinopril', dosage: '10mg', form: 'Tablet' },
  { name: 'Atorvastatin', dosage: '20mg', form: 'Tablet' },
  { name: 'Vitamin B12', dosage: '1000mcg', form: 'Injection' },
];

const STATUSES = ['submitted', 'billing', 'approved', 'processing', 'shipped', 'delivered'];

const SIGS = [
  'Take 1 tablet by mouth once daily',
  'Take 1 tablet by mouth twice daily with meals',
  'Inject subcutaneously once weekly',
  'Take 1 tablet by mouth every morning',
  'Apply as directed',
];

async function seedPrescriptions() {
  console.log('🌱 Seeding test prescriptions...\n');

  // Get all providers
  const { data: providers, error: providersError } = await supabase
    .from('providers')
    .select('id, user_id, first_name, last_name')
    .limit(10);

  if (providersError || !providers || providers.length === 0) {
    console.error('❌ No providers found. Please create a provider first.');
    return;
  }

  console.log(`✅ Found ${providers.length} provider(s)`);

  // Get all patients
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .limit(20);

  if (patientsError || !patients || patients.length === 0) {
    console.error('❌ No patients found. Please create patients first.');
    return;
  }

  console.log(`✅ Found ${patients.length} patient(s)\n`);

  // Create 10 test prescriptions
  const prescriptionsToCreate = [];

  for (let i = 0; i < 10; i++) {
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const medication = MEDICATIONS[Math.floor(Math.random() * MEDICATIONS.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const sig = SIGS[Math.floor(Math.random() * SIGS.length)];
    const quantity = [30, 60, 90][Math.floor(Math.random() * 3)];
    const refills = [0, 1, 3, 6][Math.floor(Math.random() * 4)];

    const queueId = `RX${Date.now()}${i}`;

    // Add tracking number if shipped or delivered
    const trackingNumber = (status === 'shipped' || status === 'delivered')
      ? `1Z${Math.random().toString(36).substring(2, 18).toUpperCase()}`
      : null;

    const submittedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random within last 7 days

    prescriptionsToCreate.push({
      prescriber_id: provider.user_id,
      patient_id: patient.id,
      medication: medication.name,
      dosage: medication.dosage,
      form: medication.form,
      quantity,
      refills,
      sig,
      status,
      queue_id: queueId,
      tracking_number: trackingNumber,
      submitted_at: submittedAt.toISOString(),
    });
  }

  // Insert prescriptions
  const { data: createdPrescriptions, error: insertError } = await supabase
    .from('prescriptions')
    .insert(prescriptionsToCreate)
    .select();

  if (insertError) {
    console.error('❌ Error creating prescriptions:', insertError);
    return;
  }

  console.log(`✅ Created ${createdPrescriptions?.length || 0} test prescriptions\n`);

  // Display summary
  console.log('📊 Status Distribution:');
  const statusCounts = prescriptionsToCreate.reduce((acc, rx) => {
    acc[rx.status] = (acc[rx.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  console.log('\n✅ Seeding complete!');
  console.log('\n📍 Next steps:');
  console.log('   1. Navigate to /admin/prescriptions as a pharmacy admin');
  console.log('   2. You should see all test prescriptions');
  console.log('   3. Click "Testing Mode" to manually advance statuses');
  console.log('   4. Or click "Check Status" to test DigitalRX API integration');
}

seedPrescriptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
