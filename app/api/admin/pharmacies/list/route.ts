import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: pharmacies, error } = await supabase
      .from("pharmacies")
      .select("id, name, slug, is_active, created_at")
      .order("name");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get medication counts for each pharmacy
    const pharmaciesWithCounts = await Promise.all(
      (pharmacies || []).map(async (pharmacy) => {
        const { data: medications } = await supabase
          .from("pharmacy_medications")
          .select("id")
          .eq("pharmacy_id", pharmacy.id);

        return {
          ...pharmacy,
          medication_count: medications?.length || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      pharmacies: pharmaciesWithCounts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
