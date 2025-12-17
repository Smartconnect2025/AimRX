import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Check prescription status from DigitalRx RxRequestStatus endpoint
 * Uses the pharmacy's specific API key to query status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabaseAdmin = createAdminClient();

  try {
    const prescriptionId = params.id;

    console.log(`📍 Checking status for prescription: ${prescriptionId}`);

    // Get prescription with pharmacy backend info
    const { data: prescription, error: prescError } = await supabaseAdmin
      .from("prescriptions")
      .select(`
        id,
        queue_id,
        status,
        tracking_number,
        pharmacy_id,
        medication,
        pharmacy_backends!prescriptions_pharmacy_id_fkey(
          api_key_encrypted,
          api_url,
          store_id
        )
      `)
      .eq("id", prescriptionId)
      .single();

    if (prescError || !prescription) {
      console.error("❌ Prescription not found:", prescError);
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (!prescription.queue_id) {
      return NextResponse.json(
        {
          success: false,
          error: "No queue ID - prescription may not have been submitted to DigitalRx yet"
        },
        { status: 400 }
      );
    }

    // Get pharmacy's API credentials (Supabase returns array for joined tables)
    const backend = Array.isArray(prescription.pharmacy_backends)
      ? prescription.pharmacy_backends[0]
      : prescription.pharmacy_backends;

    if (!backend) {
      console.error("❌ Pharmacy backend not found for prescription");
      return NextResponse.json(
        { success: false, error: "Pharmacy backend configuration not found" },
        { status: 404 }
      );
    }

    const DIGITALRX_API_KEY = backend.api_key_encrypted;
    const DIGITALRX_BASE_URL = backend.api_url || "https://www.dbswebserver.com/DBSRestApi/API";

    console.log(`📍 Using pharmacy backend: Store ${backend.store_id}`);
    console.log(`📍 Checking Queue ID: ${prescription.queue_id}`);

    // Call DigitalRx RxRequestStatus endpoint
    const response = await fetch(`${DIGITALRX_BASE_URL}/RxRequestStatus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": DIGITALRX_API_KEY,
      },
      body: JSON.stringify({
        StoreID: backend.store_id,
        QueueID: prescription.queue_id,
      }),
    });

    const responseText = await response.text();
    console.log(`📥 DigitalRx response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error(`❌ DigitalRx status check failed: ${response.status}`);

      // Log the failed attempt
      await supabaseAdmin.from("system_logs").insert({
        action: "PRESCRIPTION_STATUS_CHECK_FAILED",
        details: `Failed to check status for prescription ${prescriptionId} - Queue ${prescription.queue_id} - Status: ${response.status}`,
        status: "error",
      });

      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch status from DigitalRx (${response.status})`,
          details: responseText
        },
        { status: response.status }
      );
    }

    // Parse response
    let statusData;
    try {
      statusData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse DigitalRx response:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid response from DigitalRx" },
        { status: 500 }
      );
    }

    console.log(`✅ Parsed status data:`, statusData);

    // Extract status from response (normalize to lowercase)
    const newStatus = statusData.Status?.toLowerCase() || prescription.status;
    const trackingNumber = statusData.TrackingNumber || prescription.tracking_number || null;
    const lastUpdated = statusData.LastUpdated || new Date().toISOString();

    console.log(`📊 Status update: ${prescription.status} → ${newStatus}`);

    // Update prescription in database
    const { error: updateError } = await supabaseAdmin
      .from("prescriptions")
      .update({
        status: newStatus,
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId);

    if (updateError) {
      console.error("❌ Failed to update prescription:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update prescription status in database" },
        { status: 500 }
      );
    }

    // Log the successful status check
    await supabaseAdmin.from("system_logs").insert({
      action: "PRESCRIPTION_STATUS_CHECKED",
      details: `Checked status for ${prescription.medication} (Queue ${prescription.queue_id}) - Status: ${newStatus}${trackingNumber ? ` - Tracking: ${trackingNumber}` : ''}`,
      status: "success",
    });

    console.log(`✅ Prescription status updated successfully`);

    return NextResponse.json({
      success: true,
      queue_id: prescription.queue_id,
      old_status: prescription.status,
      new_status: newStatus,
      tracking_number: trackingNumber,
      last_updated: lastUpdated,
      changed: prescription.status !== newStatus,
    });

  } catch (error) {
    console.error("❌ Error checking prescription status:", error);

    // Log the error (ignore if logging fails)
    try {
      await supabaseAdmin.from("system_logs").insert({
        action: "PRESCRIPTION_STATUS_CHECK_ERROR",
        details: `Error checking status: ${error instanceof Error ? error.message : String(error)}`,
        status: "error",
      });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while checking prescription status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
