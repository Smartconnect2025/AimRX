import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Cleanup Old Medications
 * POST /api/admin/cleanup-old-meds
 */
export async function POST() {
  const supabase = createAdminClient();

  console.log("🧹 Cleaning up old medications...");

  try {
    // Delete old generic medications from the medications table
    const { error: deleteError } = await supabase
      .from("medications")
      .delete()
      .or('name.ilike.%AOD%,name.ilike.%BPC-157 3MG/ML%');

    if (deleteError) {
      console.error("Error deleting old meds:", deleteError);
    } else {
      console.log("✅ Deleted old generic medications");
    }

    // Count remaining medications in old table
    const { data: oldMeds, error: countError } = await supabase
      .from("medications")
      .select("id");

    if (countError) {
      console.error("Error counting old meds:", countError);
    }

    // Count new pharmacy_medications
    const { data: newMeds, error: newCountError } = await supabase
      .from("pharmacy_medications")
      .select("id");

    if (newCountError) {
      console.error("Error counting new meds:", newCountError);
    }

    return NextResponse.json({
      success: true,
      message: "Old medications cleaned up",
      oldMedicationsRemaining: oldMeds?.length || 0,
      pharmacyMedicationsCount: newMeds?.length || 0,
    });
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
