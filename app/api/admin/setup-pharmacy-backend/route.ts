import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { encryptApiKey } from "@/core/security/encryption";

/**
 * Setup pharmacy backend with DigitalRx credentials
 * POST /api/admin/setup-pharmacy-backend
 */
export async function POST() {
  const supabase = createAdminClient();

  try {

    // Step 1: Create or get the pharmacy

    const { data: existingPharmacy } = await supabase
      .from('pharmacies')
      .select('id, name')
      .eq('slug', 'greenwich')
      .single();

    let pharmacyId: string;

    if (existingPharmacy) {
      pharmacyId = existingPharmacy.id;
    } else {
      const { data: newPharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .insert({
          name: 'Greenwich Pharmacy',
          slug: 'greenwich',
          is_active: true,
        })
        .select('id, name')
        .single();

      if (pharmacyError || !newPharmacy) {
        console.error('❌ Error creating pharmacy:', pharmacyError);
        return NextResponse.json(
          { success: false, error: 'Failed to create pharmacy' },
          { status: 500 }
        );
      }

      pharmacyId = newPharmacy.id;
    }

    // Step 2: Check if pharmacy backend already exists

    const { data: existingBackend } = await supabase
      .from('pharmacy_backends')
      .select('id, store_id')
      .eq('pharmacy_id', pharmacyId)
      .eq('system_type', 'DigitalRx')
      .single();

    if (existingBackend) {

      // Update it with the correct credentials
      const { error: updateError } = await supabase
        .from('pharmacy_backends')
        .update({
          store_id: '190190',
          api_key_encrypted: encryptApiKey('9860F86A-9484-44F7-AC5E-5C600A90E2B1'),
          api_url: 'https://www.dbswebserver.com/DBSRestApi/API',
          is_active: true,
        })
        .eq('id', existingBackend.id);

      if (updateError) {
        console.error('❌ Error updating pharmacy backend:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update pharmacy backend' },
          { status: 500 }
        );
      }

    } else {
      // Create new pharmacy backend

      const { error: backendError } = await supabase
        .from('pharmacy_backends')
        .insert({
          pharmacy_id: pharmacyId,
          system_type: 'DigitalRx',
          store_id: '190190',
          api_key_encrypted: encryptApiKey('9860F86A-9484-44F7-AC5E-5C600A90E2B1'),
          api_url: 'https://www.dbswebserver.com/DBSRestApi/API',
          is_active: true,
        });

      if (backendError) {
        console.error('❌ Error creating pharmacy backend:', backendError);
        return NextResponse.json(
          { success: false, error: 'Failed to create pharmacy backend' },
          { status: 500 }
        );
      }

    }


    return NextResponse.json({
      success: true,
      message: 'Pharmacy backend configured successfully',
      pharmacy: {
        id: pharmacyId,
        store_id: '190190',
        system_type: 'DigitalRx',
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
