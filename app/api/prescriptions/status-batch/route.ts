import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { decryptApiKey, isEncrypted } from "@/core/security/encryption";

/**
 * Batch Prescription Status Check API
 *
 * Retrieves status updates for multiple prescriptions from DigitalRx.
 * Uses per-pharmacy API keys from pharmacy_backends table.
 */

const DIGITALRX_BASE_URL = process.env.DIGITALRX_BASE_URL || "https://www.dbswebserver.com/DBSRestApi/API";

interface BatchStatusRequest {
  prescription_ids?: string[];
  user_id?: string; // Optional: fetch all prescriptions for a user
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchStatusRequest = await request.json();
    const supabase = createAdminClient();

    let prescriptions;

    // Fetch prescriptions from database WITH pharmacy backend info
    if (body.prescription_ids && body.prescription_ids.length > 0) {
      // Fetch specific prescriptions by ID
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id,
          queue_id,
          status,
          pharmacy_id
        `)
        .in("id", body.prescription_ids);

      if (error) {
        console.error("❌ Database error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch prescriptions" },
          { status: 500 }
        );
      }

      prescriptions = data;
    } else if (body.user_id) {
      // Fetch all prescriptions for a user
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          id,
          queue_id,
          status,
          pharmacy_id
        `)
        .eq("prescriber_id", body.user_id);

      if (error) {
        console.error("❌ Database error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch prescriptions" },
          { status: 500 }
        );
      }

      prescriptions = data;
    } else {
      return NextResponse.json(
        { success: false, error: "Must provide prescription_ids or user_id" },
        { status: 400 }
      );
    }

    if (!prescriptions || prescriptions.length === 0) {
      console.log("ℹ️ No prescriptions found for user");
      return NextResponse.json(
        { success: true, statuses: [] },
        { status: 200 }
      );
    }

    console.log(`📋 Checking status for ${prescriptions.length} prescriptions`);

    // Check status for each prescription using pharmacy-specific API keys
    const statusPromises = prescriptions.map(async (prescription) => {
      if (!prescription.queue_id) {
        return {
          prescription_id: prescription.id,
          success: false,
          error: "No queue_id available",
        };
      }

      // Get pharmacy backend based on prescription's pharmacy_id
      let backend = null;

      if (prescription.pharmacy_id) {
        const { data: pharmacyBackend } = await supabase
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
        console.warn(`⚠️ No pharmacy backend for prescription ${prescription.id}, fetching default`);

        const { data: defaultBackend, error: backendError } = await supabase
          .from("pharmacy_backends")
          .select("api_key_encrypted, api_url, store_id")
          .eq("is_active", true)
          .eq("system_type", "DigitalRx")
          .limit(1)
          .single();

        if (!defaultBackend || backendError) {
          console.warn(`⚠️ No default pharmacy backend available (this is normal if not configured yet)`);
          return {
            prescription_id: prescription.id,
            success: false,
            error: "No pharmacy backend configuration - prescriptions will show database status only",
          };
        }

        backend = defaultBackend;
      }

      try {
        const DIGITALRX_API_KEY = isEncrypted(backend.api_key_encrypted)
          ? decryptApiKey(backend.api_key_encrypted)
          : backend.api_key_encrypted;
        const DIGITALRX_STATUS_URL = `${backend.api_url || DIGITALRX_BASE_URL}/RxRequestStatus`;
        const STORE_ID = backend.store_id;

        // Strip "RX-" prefix from queue_id if present (DigitalRx expects numeric only)
        const queueIdNumeric = prescription.queue_id.replace(/^RX-/i, '');

        const statusPayload = {
          StoreID: STORE_ID,
          QueueID: queueIdNumeric,
        };

        console.log(`🔍 Checking status for prescription ${prescription.id} using pharmacy Store ID: ${STORE_ID}, Queue: ${queueIdNumeric}`);

        const digitalRxResponse = await fetch(DIGITALRX_STATUS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": DIGITALRX_API_KEY,
          },
          body: JSON.stringify(statusPayload),
        });

        if (!digitalRxResponse.ok) {
          const errorText = await digitalRxResponse.text().catch(() => "Unknown error");
          console.warn(`⚠️ Status check failed for ${prescription.queue_id}:`, errorText);
          return {
            prescription_id: prescription.id,
            queue_id: prescription.queue_id,
            success: false,
            error: `API error: ${digitalRxResponse.status}`,
          };
        }

        // Get raw response text for logging
        const responseText = await digitalRxResponse.text();
        console.log(`📥 DigitalRx raw response for ${prescription.queue_id}:`, responseText);

        // Safely parse response
        let statusData;
        try {
          statusData = JSON.parse(responseText);
          console.log(`✅ Parsed status data for ${prescription.queue_id}:`, statusData);
        } catch (parseError) {
          console.error(`❌ Invalid JSON response for ${prescription.queue_id}:`, responseText.substring(0, 500));
          return {
            prescription_id: prescription.id,
            queue_id: prescription.queue_id,
            success: false,
            error: "Invalid response from DigitalRx (not JSON)",
            raw_response: responseText.substring(0, 200),
          };
        }

        // Check for error in response body
        if (statusData.Error) {
          console.warn(`⚠️ DigitalRx error for ${prescription.queue_id}:`, statusData.Error);
          return {
            prescription_id: prescription.id,
            queue_id: prescription.queue_id,
            success: false,
            error: statusData.Error,
            digitalrx_response: statusData,
          };
        }

        // Update prescription status in database based on DigitalRx response
        let newStatus = prescription.status;
        if (statusData.DeliveredDate) {
          newStatus = "delivered";
        } else if (statusData.PickupDate) {
          newStatus = "shipped";
        } else if (statusData.ApprovedDate) {
          newStatus = "approved";
        } else if (statusData.PackDateTime) {
          newStatus = "processing";
        }

        // Update database with new status
        if (newStatus !== prescription.status) {
          await supabase
            .from("prescriptions")
            .update({ status: newStatus })
            .eq("id", prescription.id);
        }

        return {
          prescription_id: prescription.id,
          queue_id: prescription.queue_id,
          success: true,
          status: statusData,
          updated_status: newStatus,
        };
      } catch (error) {
        console.error(`❌ Error checking status for ${prescription.queue_id}:`, error);
        return {
          prescription_id: prescription.id,
          queue_id: prescription.queue_id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const statuses = await Promise.all(statusPromises);

    console.log(`✅ Retrieved ${statuses.filter(s => s.success).length}/${statuses.length} statuses`);

    return NextResponse.json(
      {
        success: true,
        statuses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Batch Status Check Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        error_details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
