import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * DigitalRx Webhook Endpoint
 *
 * This endpoint receives status updates from DigitalRx/pharmacy systems
 * and automatically updates prescription status in real-time.
 *
 * Expected payload:
 * {
 *   queue_id: string;      // RX-ABC123-4567
 *   new_status: string;    // approved, packed, shipped, delivered
 *   tracking_number?: string; // Optional tracking number for shipped orders
 * }
 */

const VALID_STATUSES = ["submitted", "billing", "approved", "packed", "shipped", "delivered"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queue_id, new_status, tracking_number } = body;

    // Validate required fields
    if (!queue_id || !new_status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: queue_id and new_status are required"
        },
        { status: 400 }
      );
    }

    // Validate status
    if (!VALID_STATUSES.includes(new_status.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`
        },
        { status: 400 }
      );
    }

    // Create admin client to update database
    const supabaseAdmin = createAdminClient();

    // Find prescription by queue_id
    const { data: prescription, error: findError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, status, queue_id")
      .eq("queue_id", queue_id)
      .single();

    if (findError || !prescription) {
      console.error("Prescription not found:", queue_id, findError);
      return NextResponse.json(
        {
          success: false,
          error: `Prescription with queue_id ${queue_id} not found`
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      status: string;
      updated_at: string;
      tracking_number?: string;
    } = {
      status: new_status.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    // Add tracking number if provided and status is shipped
    if (tracking_number && new_status.toLowerCase() === "shipped") {
      updateData.tracking_number = tracking_number;
    }

    // Update prescription status
    const { error: updateError } = await supabaseAdmin
      .from("prescriptions")
      .update(updateData)
      .eq("id", prescription.id);

    if (updateError) {
      console.error("Error updating prescription:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update prescription status"
        },
        { status: 500 }
      );
    }

    // Log the webhook event to system_logs
    await supabaseAdmin.from("system_logs").insert({
      user_id: null, // Webhook is automated, no user
      user_email: "webhook@digitalrx.com",
      user_name: "DigitalRx Webhook",
      action: "WEBHOOK_STATUS_UPDATE",
      details: `Status updated from '${prescription.status}' to '${new_status}' for prescription ${queue_id}${tracking_number ? ` (Tracking: ${tracking_number})` : ""}`,
      queue_id: queue_id,
      status: "success",
    });


    return NextResponse.json(
      {
        success: true,
        message: "Prescription status updated successfully",
        data: {
          queue_id: queue_id,
          old_status: prescription.status,
          new_status: new_status.toLowerCase(),
          tracking_number: tracking_number || null,
          updated_at: updateData.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
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
      expectedPayload: {
        queue_id: "RX-ABC123-4567",
        new_status: "shipped",
        tracking_number: "1Z999AA10123456784 (optional)",
      },
      validStatuses: VALID_STATUSES,
    },
    { status: 200 }
  );
}
