/**
 * Migration script to link existing medications and prescriptions to the default pharmacy
 *
 * This fixes medications and prescriptions created before multi-pharmacy support was added.
 * Run with: npx tsx scripts/fix-medication-pharmacy-links.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMedicationPharmacyLinks() {
  console.log('🔧 Starting medication and prescription pharmacy link fix...\n');

  // Step 1: Get the default pharmacy (with Store ID 190190)
  console.log('1️⃣ Finding default pharmacy with DigitalRx backend...');

  const { data: pharmacyBackend, error: backendError } = await supabase
    .from('pharmacy_backends')
    .select('pharmacy_id, store_id, pharmacies(id, name)')
    .eq('store_id', '190190')
    .eq('system_type', 'DigitalRx')
    .eq('is_active', true)
    .single();

  if (backendError || !pharmacyBackend) {
    console.error('❌ Error: Could not find pharmacy with Store ID 190190');
    console.error('Please ensure you have a pharmacy_backends record with:');
    console.error('  - store_id: "190190"');
    console.error('  - system_type: "DigitalRx"');
    console.error('  - is_active: true');
    process.exit(1);
  }

  const defaultPharmacyId = pharmacyBackend.pharmacy_id;
  const pharmacyInfo = Array.isArray(pharmacyBackend.pharmacies)
    ? pharmacyBackend.pharmacies[0]
    : pharmacyBackend.pharmacies;

  console.log(`✅ Found pharmacy: ${pharmacyInfo?.name || 'Unknown'}`);
  console.log(`   Pharmacy ID: ${defaultPharmacyId}`);
  console.log(`   Store ID: ${pharmacyBackend.store_id}\n`);

  // Step 2: Update medications without pharmacy_id
  console.log('2️⃣ Updating medications without pharmacy_id...');

  const { data: medicationsToUpdate, error: medError } = await supabase
    .from('pharmacy_medications')
    .select('id, name')
    .is('pharmacy_id', null);

  if (medError) {
    console.error('❌ Error fetching medications:', medError);
    process.exit(1);
  }

  if (medicationsToUpdate && medicationsToUpdate.length > 0) {
    console.log(`   Found ${medicationsToUpdate.length} medications to update`);

    const { error: updateMedError } = await supabase
      .from('pharmacy_medications')
      .update({ pharmacy_id: defaultPharmacyId })
      .is('pharmacy_id', null);

    if (updateMedError) {
      console.error('❌ Error updating medications:', updateMedError);
      process.exit(1);
    }

    console.log(`✅ Updated ${medicationsToUpdate.length} medications\n`);
  } else {
    console.log('✅ All medications already have pharmacy_id set\n');
  }

  // Step 3: Update prescriptions without pharmacy_id
  console.log('3️⃣ Updating prescriptions without pharmacy_id...');

  const { data: prescriptionsToUpdate, error: rxError } = await supabase
    .from('prescriptions')
    .select('id, queue_id, medication')
    .is('pharmacy_id', null);

  if (rxError) {
    console.error('❌ Error fetching prescriptions:', rxError);
    process.exit(1);
  }

  if (prescriptionsToUpdate && prescriptionsToUpdate.length > 0) {
    console.log(`   Found ${prescriptionsToUpdate.length} prescriptions to update`);

    const { error: updateRxError } = await supabase
      .from('prescriptions')
      .update({ pharmacy_id: defaultPharmacyId })
      .is('pharmacy_id', null);

    if (updateRxError) {
      console.error('❌ Error updating prescriptions:', updateRxError);
      process.exit(1);
    }

    console.log(`✅ Updated ${prescriptionsToUpdate.length} prescriptions\n`);
  } else {
    console.log('✅ All prescriptions already have pharmacy_id set\n');
  }

  // Step 4: Verify the fixes
  console.log('4️⃣ Verifying fixes...');

  const { count: medCount } = await supabase
    .from('pharmacy_medications')
    .select('*', { count: 'exact', head: true })
    .is('pharmacy_id', null);

  const { count: rxCount } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .is('pharmacy_id', null);

  if (medCount === 0 && rxCount === 0) {
    console.log('✅ All medications and prescriptions now have pharmacy_id set!');
    console.log('\n🎉 Migration complete! Status check APIs should now work.');
  } else {
    console.warn(`⚠️ Warning: Still have ${medCount} medications and ${rxCount} prescriptions without pharmacy_id`);
  }
}

// Run the migration
fixMedicationPharmacyLinks()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
