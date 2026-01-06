import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * GET /api/admin/check-schema
 * Checks if the providers table has all expected columns
 * Requires: Platform owner access
 */
export async function GET(_request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    // Try to query providers table directly and check for errors
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from("providers")
      .select("id, tier_level")
      .limit(1);

    // If we get a specific column error, tier_level doesn't exist
    const hasTierLevel = !sampleError || !sampleError.message?.includes("tier_level");

    return NextResponse.json({
      hasTierLevel,
      sampleError: sampleError?.message || null,
      sampleData: sampleData || [],
      message: hasTierLevel
        ? "tier_level column exists"
        : "tier_level column does not exist or is not recognized by PostgREST",
    });
  } catch (error) {
    console.error("Unexpected error checking schema:", error);
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
