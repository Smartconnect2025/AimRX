import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Batch Prescription Status Check API
 *
 * Retrieves status updates for multiple prescriptions from DigitalRx.
 */

const DIGITALRX_API_KEY = process.env.DIGITALRX_API_KEY || "12345678901234567890";
const DIGITALRX_STATUS_URL = "https://www.dbswebserver.com/DBSRestApi/API/RxRequestStatus";
const STORE_ID = "190190"; // Greenwich

interface BatchStatusRequest {
  prescription_ids?: string[];
  user_id?: string; // Optional: fetch all prescriptions for a user
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchStatusRequest = await request.json();
    const supabase = createAdminClient();

    let prescriptions;

    // Fetch prescriptions from database
    if (body.prescription_ids && body.prescription_ids.length > 0) {
      // Fetch specific prescriptions by ID
      const { data, error } = await supabase
        .from("prescriptions")
        .select("id, queue_id, status")
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
        .select("id, queue_id, status")
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
      return NextResponse.json(
        { success: true, statuses: [] },
        { status: 200 }
      );
    }

    console.log(`📋 Checking status for ${prescriptions.length} prescriptions`);

    // Check status for each prescription
    const statusPromises = prescriptions.map(async (prescription) => {
      if (!prescription.queue_id) {
        return {
          prescription_id: prescription.id,
          success: false,
          error: "No queue_id available",
        };
      }

      try {
        const statusPayload = {
          StoreID: STORE_ID,
          QueueID: prescription.queue_id,
        };

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

        const statusData = await digitalRxResponse.json();

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
