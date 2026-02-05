import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * DigitalRx Webhook Endpoint
 *
 * This endpoint receives status updates from DigitalRx/pharmacy systems
 * and automatically updates prescription status in real-time.
 *
 * DigitalRx sends the full prescription payload:
 * {
 *   StoreID: string;
 *   RxNumber: string;        // Used to find prescription (matches queue_id)
 *   DeliveryDate?: string;   // If present, status = delivered
 *   TrackingNumber?: string; // If present, status = shipped
 *   PrintedDate?: string;    // If present, status = approved
 *   RxStatus?: string;       // Direct status if provided
 *   Patient: { ... }
 *   Doctor: { ... }
 *   ...
 * }
 */

const VALID_STATUSES = [
  "submitted",
  "billing",
  "approved",
  "packed",
  "shipped",
  "delivered",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function determineStatusFromPayload(body: any): string {
  // If RxStatus is explicitly provided, use it
  if (body.RxStatus) {
    const rxStatus = body.RxStatus.toLowerCase();
    if (VALID_STATUSES.includes(rxStatus)) {
      return rxStatus;
    }
    // Map common DigitalRx statuses
    if (rxStatus === "complete" || rxStatus === "completed") return "delivered";
    if (rxStatus === "processing" || rxStatus === "pending") return "approved";
  }

  // Determine status from date fields (priority order)
  if (body.DeliveryDate) {
    return "delivered";
  }
  if (body.TrackingNumber) {
    return "shipped";
  }
  if (body.PrintedDate || body.LastFilledDate) {
    return "packed";
  }
  if (body.ApprovedByInitials) {
    return "approved";
  }

  // Default to approved if we received a webhook (means it's being processed)
  return "approved";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.error(
      "📥 [webhook/digitalrx] Received payload:",
      JSON.stringify(body, null, 2),
    );

    // Support both formats:
    // 1. Simple format: { queue_id, new_status, tracking_number }
    // 2. DigitalRx format: { RxNumber, DeliveryDate, TrackingNumber, ... }

    let queueId: string | undefined;
    let rxNumber: string | undefined;
    let newStatus: string;
    let trackingNumber: string | undefined;

    // Check if it's the simple format
    if (body.queue_id && body.new_status) {
      queueId = body.queue_id;
      newStatus = body.new_status;
      trackingNumber = body.tracking_number;
    }
    // DigitalRx format
    else if (body.RxNumber) {
      queueId = body.RxNumber;
      rxNumber = body.RxNumber;
      newStatus = determineStatusFromPayload(body);
      trackingNumber = body.TrackingNumber;
    } else {
      console.error(
        "❌ [webhook/digitalrx] Invalid payload - missing queue_id or RxNumber",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: queue_id/RxNumber is required",
        },
        { status: 400 },
      );
    }

    console.error(
      `📋 [webhook/digitalrx] Processing: queueId=${queueId}, newStatus=${newStatus}, tracking=${trackingNumber}`,
    );

    // Validate status
    if (!VALID_STATUSES.includes(newStatus.toLowerCase())) {
      console.error(`❌ [webhook/digitalrx] Invalid status: ${newStatus}`);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status '${newStatus}'. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Create admin client to update database
    const supabaseAdmin = createAdminClient();

    // Try exact match
    const { data: prescription, error: findError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, status, queue_id")
      .eq("rx_number", rxNumber)
      .single();

    if (findError || !prescription) {
      console.error(
        "❌ [webhook/digitalrx] Prescription not found:",
        queueId,
        findError,
      );
      return NextResponse.json(
        {
          success: false,
          error: `Prescription with rx_number ${rxNumber} and queue_id ${queueId} not found`,
        },
        { status: 404 },
      );
    }

    console.error(
      `✅ [webhook/digitalrx] Found prescription: ${prescription.id}, current status: ${prescription.status}`,
    );

    // Prepare update data
    const updateData: {
      status: string;
      updated_at: string;
      tracking_number?: string;
      order_progress?: string;
    } = {
      status: newStatus.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    // Add tracking number if provided
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    // Update order_progress based on status
    if (newStatus === "shipped") {
      updateData.order_progress = "shipped";
    } else if (newStatus === "delivered") {
      updateData.order_progress = "delivered";
    }

    // Update prescription status
    const { error: updateError } = await supabaseAdmin
      .from("prescriptions")
      .update(updateData)
      .eq("id", prescription.id);

    if (updateError) {
      console.error(
        "❌ [webhook/digitalrx] Error updating prescription:",
        updateError,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update prescription status",
        },
        { status: 500 },
      );
    }

    console.error(
      `✅ [webhook/digitalrx] Updated prescription ${prescription.id}: ${prescription.status} -> ${newStatus}`,
    );

    // Log the webhook event to system_logs
    await supabaseAdmin.from("system_logs").insert({
      user_id: null, // Webhook is automated, no user
      user_email: "webhook@digitalrx.com",
      user_name: "DigitalRx Webhook",
      action: "WEBHOOK_STATUS_UPDATE",
      details: `Status updated from '${prescription.status}' to '${newStatus}' for prescription ${queueId}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ""}`,
      queue_id: queueId,
      status: "success",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Prescription status updated successfully",
        data: {
          queue_id: queueId,
          old_status: prescription.status,
          new_status: newStatus.toLowerCase(),
          tracking_number: trackingNumber || null,
          updated_at: updateData.updated_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ [webhook/digitalrx] Webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "DigitalRx webhook endpoint is active",
      endpoint: "/api/webhook/digitalrx",
      method: "POST",
      supportedFormats: {
        simple: {
          description: "Simple format with explicit status",
          example: {
            queue_id: "RX98765",
            new_status: "shipped",
            tracking_number: "1Z999AA10123456784 (optional)",
          },
        },
        digitalrx: {
          description: "Full DigitalRx payload - status is derived from fields",
          example: {
            RxNumber: "RX98765",
            DeliveryDate: "1/1/2025 (if delivered)",
            TrackingNumber: "1Z999AA10123456784 (if shipped)",
            PrintedDate: "1/1/2025 (if packed)",
            RxStatus: "optional explicit status",
          },
        },
      },
      statusDerivation: {
        DeliveryDate: "delivered",
        TrackingNumber: "shipped",
        PrintedDate: "packed",
        ApprovedByInitials: "approved",
        default: "approved",
      },
      validStatuses: VALID_STATUSES,
    },
    { status: 200 },
  );
}
