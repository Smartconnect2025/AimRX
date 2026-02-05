import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { decryptApiKey, isEncrypted } from "@/core/security/encryption";

/**
 * Check prescription status from DigitalRx RxRequestStatus endpoint
 * Uses the pharmacy's specific API key to query status
 * Note: Strips "RX-" prefix from queue_id before sending to DigitalRx
 * @route POST /api/prescriptions/[id]/check-status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabaseAdmin = createAdminClient();

  try {
    const prescriptionId = params.id;

    // Get prescription
    const { data: prescription, error: prescError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, queue_id, status, tracking_number, pharmacy_id, medication")
      .eq("id", prescriptionId)
      .single();

    if (prescError || !prescription) {
      console.error("❌ Prescription not found:", prescError);
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 },
      );
    }

    if (!prescription.queue_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No queue ID - prescription may not have been submitted to DigitalRx yet",
        },
        { status: 400 },
      );
    }

    // Get pharmacy backend based on prescription's pharmacy_id
    let backend = null;

    if (prescription.pharmacy_id) {
      const { data: pharmacyBackend } = await supabaseAdmin
        .from("pharmacy_backends")
        .select("api_key_encrypted, api_url, store_id")
        .eq("pharmacy_id", prescription.pharmacy_id)
        .eq("is_active", true)
        .eq("system_type", "DigitalRx")
        .single();

      backend = pharmacyBackend;
    }

    // If no pharmacy backend found, try to get default backend
    if (!backend) {
      const { data: defaultBackend } = await supabaseAdmin
        .from("pharmacy_backends")
        .select("api_key_encrypted, api_url, store_id")
        .eq("is_active", true)
        .eq("system_type", "DigitalRx")
        .limit(1)
        .single();

      if (!defaultBackend) {
        console.error("❌ No pharmacy backend found for prescription");
        return NextResponse.json(
          {
            success: false,
            error:
              "Pharmacy backend configuration not found. Please contact support.",
          },
          { status: 404 },
        );
      }

      backend = defaultBackend;
    }

    const DIGITALRX_API_KEY = isEncrypted(backend.api_key_encrypted)
      ? decryptApiKey(backend.api_key_encrypted)
      : backend.api_key_encrypted;
    const DIGITALRX_BASE_URL =
      backend.api_url ||
      process.env.NEXT_PUBLIC_DIGITALRX_BASE_URL ||
      "https://www.dbswebserver.com/DBSRestApi/API";

    // Strip "RX-" prefix from queue_id if present (DigitalRx expects numeric only)
    const queueIdNumeric = prescription.queue_id.replace(/^RX-/i, "");

    // Call DigitalRx RxRequestStatus endpoint
    const response = await fetch(`${DIGITALRX_BASE_URL}/RxRequestStatus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: DIGITALRX_API_KEY,
      },
      body: JSON.stringify({
        StoreID: backend.store_id,
        QueueID: queueIdNumeric,
      }),
    });

    const responseText = await response.text();

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
          details: responseText,
        },
        { status: response.status },
      );
    }

    // Parse response
    let statusData;
    try {
      statusData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Failed to parse DigitalRx response:", parseError);
      console.error("Raw response text:", responseText);

      // Log parse error to database
      await supabaseAdmin.from("system_logs").insert({
        action: "DIGITALRX_PARSE_ERROR",
        details: `Parse error for Queue ${prescription.queue_id}: ${responseText.substring(0, 1000)}`,
        status: "error",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from DigitalRx",
          details: responseText.substring(0, 500), // Include first 500 chars of response
        },
        { status: 500 },
      );
    }

    // Extract status from response (normalize to lowercase)
    const newStatus = statusData.Status?.toLowerCase() || prescription.status;
    const trackingNumber =
      statusData.TrackingNumber || prescription.tracking_number || null;
    const lastUpdated = statusData.LastUpdated || new Date().toISOString();

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
        {
          success: false,
          error: "Failed to update prescription status in database",
        },
        { status: 500 },
      );
    }

    // Log the successful status check
    await supabaseAdmin.from("system_logs").insert({
      action: "PRESCRIPTION_STATUS_CHECKED",
      details: `Checked status for ${prescription.medication} (Queue ${prescription.queue_id}) - Status: ${newStatus}${trackingNumber ? ` - Tracking: ${trackingNumber}` : ""}`,
      status: "success",
    });

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
      { status: 500 },
    );
  }
}
