import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Update Greenwich pharmacy Store ID to 190520
 * GET /api/admin/update-store-id
 */
export async function GET() {
  const supabase = createAdminClient();

  try {
    // Update Greenwich pharmacy backend with new Store ID
    const { data: updated, error } = await supabase
      .from("pharmacy_backends")
      .update({ store_id: "190520" })
      .eq("system_type", "DigitalRx")
      .eq("is_active", true)
      .select();

    if (error) {
      console.error("Error updating Store ID:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Updated Store ID to 190520",
      updated: updated,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
