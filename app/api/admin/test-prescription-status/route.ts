/**
 * Admin Test Prescription Status API
 *
 * Allows pharmacy admins to manually advance prescription status for testing purposes.
 * This simulates the DigitalRX status progression without calling their API.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

const STATUS_PROGRESSION = {
  submitted: "billing",
  billing: "approved",
  approved: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: "delivered", // Final state
};

// Generate fake tracking number
const generateTrackingNumber = () => {
  const prefix = "1Z";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let tracking = prefix;
  for (let i = 0; i < 16; i++) {
    tracking += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tracking;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prescription_id, action } = body;

    if (!prescription_id) {
      return NextResponse.json(
        { success: false, error: "prescription_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current prescription
    const { data: prescription, error: fetchError } = await supabase
      .from("prescriptions")
      .select("id, status, tracking_number")
      .eq("id", prescription_id)
      .single();

    if (fetchError || !prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    let newStatus = prescription.status;
    let trackingNumber = prescription.tracking_number;

    if (action === "advance") {
      // Advance to next status
      const currentStatus = prescription.status.toLowerCase();
      newStatus = STATUS_PROGRESSION[currentStatus as keyof typeof STATUS_PROGRESSION] || currentStatus;

      // Add tracking number when transitioning to shipped
      if (newStatus === "shipped" && !trackingNumber) {
        trackingNumber = generateTrackingNumber();
      }
    } else if (action === "reset") {
      // Reset to submitted
      newStatus = "submitted";
      trackingNumber = null;
    }

    // Update prescription
    const { error: updateError } = await supabase
      .from("prescriptions")
      .update({
        status: newStatus,
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescription_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update prescription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        prescription_id,
        old_status: prescription.status,
        new_status: newStatus,
        tracking_number: trackingNumber,
      },
    });
  } catch (error) {
    console.error("Test status update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Batch update - advance multiple prescriptions
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 1 } = body;

    const supabase = createAdminClient();

    // Get prescriptions that can be advanced (not delivered)
    const { data: prescriptions, error: fetchError } = await supabase
      .from("prescriptions")
      .select("id, status, tracking_number")
      .neq("status", "delivered")
      .order("submitted_at", { ascending: false })
      .limit(count);

    if (fetchError || !prescriptions || prescriptions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No prescriptions found to advance" },
        { status: 404 }
      );
    }

    const updates = [];

    for (const prescription of prescriptions) {
      const currentStatus = prescription.status.toLowerCase();
      const newStatus = STATUS_PROGRESSION[currentStatus as keyof typeof STATUS_PROGRESSION] || currentStatus;

      let trackingNumber = prescription.tracking_number;
      if (newStatus === "shipped" && !trackingNumber) {
        trackingNumber = generateTrackingNumber();
      }

      await supabase
        .from("prescriptions")
        .update({
          status: newStatus,
          tracking_number: trackingNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prescription.id);

      updates.push({
        prescription_id: prescription.id,
        old_status: prescription.status,
        new_status: newStatus,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        updated_count: updates.length,
        updates,
      },
    });
  } catch (error) {
    console.error("Batch test status update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
