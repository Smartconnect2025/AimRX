import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Fix pharmacy links for existing medications and prescriptions
 * POST /api/admin/fix-pharmacy-links
 */
export async function POST() {
  const supabase = createAdminClient();

  try {
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
      return NextResponse.json(
        {
          success: false,
          error: 'Could not find pharmacy with Store ID 190190. Please ensure you have a pharmacy_backends record configured.'
        },
        { status: 404 }
      );
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
      return NextResponse.json(
        { success: false, error: 'Error fetching medications' },
        { status: 500 }
      );
    }

    let medicationsUpdated = 0;
    if (medicationsToUpdate && medicationsToUpdate.length > 0) {
      console.log(`   Found ${medicationsToUpdate.length} medications to update`);

      const { error: updateMedError } = await supabase
        .from('pharmacy_medications')
        .update({ pharmacy_id: defaultPharmacyId })
        .is('pharmacy_id', null);

      if (updateMedError) {
        console.error('❌ Error updating medications:', updateMedError);
        return NextResponse.json(
          { success: false, error: 'Error updating medications' },
          { status: 500 }
        );
      }

      medicationsUpdated = medicationsToUpdate.length;
      console.log(`✅ Updated ${medicationsUpdated} medications\n`);
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
      return NextResponse.json(
        { success: false, error: 'Error fetching prescriptions' },
        { status: 500 }
      );
    }

    let prescriptionsUpdated = 0;
    if (prescriptionsToUpdate && prescriptionsToUpdate.length > 0) {
      console.log(`   Found ${prescriptionsToUpdate.length} prescriptions to update`);

      const { error: updateRxError } = await supabase
        .from('prescriptions')
        .update({ pharmacy_id: defaultPharmacyId })
        .is('pharmacy_id', null);

      if (updateRxError) {
        console.error('❌ Error updating prescriptions:', updateRxError);
        return NextResponse.json(
          { success: false, error: 'Error updating prescriptions' },
          { status: 500 }
        );
      }

      prescriptionsUpdated = prescriptionsToUpdate.length;
      console.log(`✅ Updated ${prescriptionsUpdated} prescriptions\n`);
    } else {
      console.log('✅ All prescriptions already have pharmacy_id set\n');
    }

    console.log('🎉 Migration complete!');

    return NextResponse.json({
      success: true,
      message: 'Successfully linked medications and prescriptions to pharmacy',
      pharmacy: {
        id: defaultPharmacyId,
        name: pharmacyInfo?.name,
        store_id: pharmacyBackend.store_id,
      },
      updated: {
        medications: medicationsUpdated,
        prescriptions: prescriptionsUpdated,
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
