import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * DigitalRx Webhook Endpoint
 *
 * This endpoint receives status updates from DigitalRx/pharmacy systems
 * and automatically updates prescription status in real-time.
 *
 * DigitalRx sends a payload with:
 *   QueueID: string;         // Used to find prescription (matches queue_id)
 *   RxStatus?: string;       // Stored as prescription status
 *   TrackingNumber?: string; // Stored as tracking_number
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.error(
      "📥 [webhook/digitalrx] Received payload:",
      JSON.stringify(body, null, 2),
    );

    // Support both formats:
    // 1. Simple format: { queue_id, new_status, tracking_number }
    // 2. DigitalRx format: { QueueID, RxStatus, TrackingNumber }

    let queueId: string | undefined;
    let newStatus: string;
    let trackingNumber: string | undefined;

    // Check if it's the simple format
    if (body.queue_id && body.new_status) {
      queueId = body.queue_id;
      newStatus = body.new_status;
      trackingNumber = body.tracking_number;
    }
    // DigitalRx format
    else if (body.QueueID) {
      queueId = body.QueueID;
      newStatus = body.RxStatus?.toLowerCase() || "submitted";
      trackingNumber = body.TrackingNumber;
    } else {
      console.error(
        "❌ [webhook/digitalrx] Invalid payload - missing queue_id or QueueID",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: queue_id/QueueID is required",
        },
        { status: 400 },
      );
    }

    console.error(
      `📋 [webhook/digitalrx] Processing: queueId=${queueId}, newStatus=${newStatus}, tracking=${trackingNumber}`,
    );

    // Create admin client to update database
    const supabaseAdmin = createAdminClient();

    // Try exact match
    const { data: prescription, error: findError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, status, queue_id")
      .eq("queue_id", queueId)
      .single();

    if (findError || !prescription) {
      console.error(
        "❌ [webhook/digitalrx] Prescription not found:",
        queueId,
        findError,
      );
      await supabaseAdmin.from("system_logs").insert({
        user_id: null,
        user_email: "webhook@digitalrx.com",
        user_name: "DigitalRx Webhook",
        action: "WEBHOOK_STATUS_UPDATE",
        details: `Prescription with queue_id ${queueId} not found`,
        queue_id: queueId,
        status: "error",
      });
      return NextResponse.json(
        {
          success: false,
          error: `Prescription with queue_id ${queueId} not found`,
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
    const normalizedStatus = newStatus.toLowerCase();
    if (normalizedStatus === "shipped") {
      updateData.order_progress = "shipped";
    } else if (normalizedStatus === "delivered") {
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
      await supabaseAdmin.from("system_logs").insert({
        user_id: null,
        user_email: "webhook@digitalrx.com",
        user_name: "DigitalRx Webhook",
        action: "WEBHOOK_STATUS_UPDATE",
        details: `Failed to update prescription ${prescription.id} (queue_id: ${queueId}): ${updateError.message}`,
        queue_id: queueId,
        status: "error",
      });
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
    try {
      const supabaseAdmin = createAdminClient();
      await supabaseAdmin.from("system_logs").insert({
        user_id: null,
        user_email: "webhook@digitalrx.com",
        user_name: "DigitalRx Webhook",
        action: "WEBHOOK_STATUS_UPDATE",
        details: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        status: "error",
      });
    } catch {
      // If logging itself fails, we already have console.error above
    }
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
          description: "DigitalRx payload - RxStatus and TrackingNumber stored directly",
          example: {
            QueueID: "12345",
            RxStatus: "shipped",
            TrackingNumber: "1Z999AA10123456784 (optional)",
          },
        },
      },
      fields: {
        QueueID: "Used to find the prescription (matches queue_id)",
        RxStatus: "Stored as prescription status",
        TrackingNumber: "Stored as tracking_number",
      },
    },
    { status: 200 },
  );
}
