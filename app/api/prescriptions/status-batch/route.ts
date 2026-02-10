import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { decryptApiKey, isEncrypted } from "@/core/security/encryption";

/**
 * Batch Prescription Status Check API
 *
 * Retrieves status updates for multiple prescriptions from DigitalRx.
 * Uses per-pharmacy API keys from pharmacy_backends table.
 */

const DIGITALRX_BASE_URL =
  process.env.NEXT_PUBLIC_DIGITALRX_BASE_URL ||
  "https://www.dbswebserver.com/DBSRestApi/API";

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
        .select(
          `
          id,
          queue_id,
          status,
          pharmacy_id
        `,
        )
        .in("id", body.prescription_ids);

      if (error) {
        console.error("❌ Database error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch prescriptions" },
          { status: 500 },
        );
      }

      prescriptions = data;
    } else if (body.user_id) {
      // Fetch all prescriptions for a user
      const { data, error } = await supabase
        .from("prescriptions")
        .select(
          `
          id,
          queue_id,
          status,
          pharmacy_id
        `,
        )
        .eq("prescriber_id", body.user_id);

      if (error) {
        console.error("❌ Database error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch prescriptions" },
          { status: 500 },
        );
      }

      prescriptions = data;
    } else {
      return NextResponse.json(
        { success: false, error: "Must provide prescription_ids or user_id" },
        { status: 400 },
      );
    }

    if (!prescriptions || prescriptions.length === 0) {
      return NextResponse.json(
        { success: true, statuses: [] },
        { status: 200 },
      );
    }

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
        const { data: defaultBackend, error: backendError } = await supabase
          .from("pharmacy_backends")
          .select("api_key_encrypted, api_url, store_id")
          .eq("is_active", true)
          .eq("system_type", "DigitalRx")
          .limit(1)
          .single();

        if (!defaultBackend || backendError) {
          return {
            prescription_id: prescription.id,
            success: false,
            error:
              "No pharmacy backend configuration - prescriptions will show database status only",
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
        const queueIdNumeric = prescription.queue_id.replace(/^RX-/i, "");

        const statusPayload = {
          StoreID: STORE_ID,
          QueueID: queueIdNumeric,
        };

        const digitalRxResponse = await fetch(DIGITALRX_STATUS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: DIGITALRX_API_KEY,
          },
          body: JSON.stringify(statusPayload),
        });

        if (!digitalRxResponse.ok) {
          const errorText = await digitalRxResponse
            .text()
            .catch(() => "Unknown error");
          return {
            prescription_id: prescription.id,
            queue_id: prescription.queue_id,
            success: false,
            error_text: errorText,
            error: `API error: ${digitalRxResponse.status}`,
          };
        }

        // Get raw response text
        const responseText = await digitalRxResponse.text();

        // Safely parse response
        let statusData;
        try {
          statusData = JSON.parse(responseText);
        } catch {
          return {
            prescription_id: prescription.id,
            queue_id: prescription.queue_id,
            success: false,
            error: "Invalid response from DigitalRx (not JSON)",
            raw_response: responseText.substring(0, 200),
          };
        }

        // Debug log (using console.error as per project linting rules)
        console.error(
          `📥 [status-batch] DigitalRx response for ${prescription.queue_id}:`,
          JSON.stringify(statusData),
        );

        // Check for error in response body
        if (statusData.Error) {
          return {
            prescription_id: prescription.id,
            queue_id: prescription.queue_id,
            success: false,
            error: statusData.Error,
            digitalrx_response: statusData,
          };
        }

        // Update prescription status in database based on DigitalRx response
        // DigitalRx status progression:
        // 1. Submitted - Prescription received, QueueID assigned
        // 2. Packed - Pharmacy fills prescription (PackDateTime set)
        // 3. Approved - Pharmacist approval for shipping (ApprovedDate set)
        // 4. Picked Up - Carrier collects package (PickupDate, TrackingNumber set)
        // 5. Delivered - Patient receives prescription (DeliveredDate set)
        let newStatus = prescription.status;
        let trackingNumber = null;

        // First check the Status field
        if (statusData.Status) {
          const digitalRxStatus = statusData.Status.toLowerCase().trim();
          if (digitalRxStatus === "delivered") {
            newStatus = "delivered";
          } else if (digitalRxStatus === "picked up") {
            newStatus = "picked_up";
          } else if (digitalRxStatus === "approved") {
            newStatus = "approved";
          } else if (digitalRxStatus === "packed") {
            newStatus = "packed";
          } else if (digitalRxStatus === "submitted") {
            newStatus = "submitted";
          }
        }
        // Fallback to date fields
        else if (statusData.DeliveredDate) {
          newStatus = "delivered";
        } else if (statusData.PickupDate) {
          newStatus = "picked_up";
        } else if (statusData.ApprovedDate) {
          newStatus = "approved";
        } else if (statusData.PackDateTime) {
          newStatus = "packed";
        }

        // Extract tracking number if available
        if (statusData.TrackingNumber) {
          trackingNumber = statusData.TrackingNumber;
        }

        // Update database with new status and tracking number
        const updates: { status?: string; tracking_number?: string } = {};
        if (newStatus !== prescription.status) {
          updates.status = newStatus;
        }
        if (trackingNumber) {
          updates.tracking_number = trackingNumber;
        }

        if (Object.keys(updates).length > 0) {
          console.error(
            `📝 [status-batch] Updating prescription ${prescription.id}: ${JSON.stringify(updates)}`,
          );
          await supabase
            .from("prescriptions")
            .update(updates)
            .eq("id", prescription.id);
        }

        return {
          prescription_id: prescription.id,
          queue_id: prescription.queue_id,
          success: true,
          status: statusData,
          updated_status: newStatus,
          tracking_number: trackingNumber,
        };
      } catch (error) {
        console.error(
          `❌ Error checking status for ${prescription.queue_id}:`,
          error,
        );
        return {
          prescription_id: prescription.id,
          queue_id: prescription.queue_id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const statuses = await Promise.all(statusPromises);

    return NextResponse.json(
      {
        success: true,
        statuses,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Batch Status Check Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          error_details: error instanceof Error ? error.stack : String(error),
        }),
      },
      { status: 500 },
    );
  }
}
