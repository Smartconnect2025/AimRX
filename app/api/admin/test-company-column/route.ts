import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function GET() {
  try {
    const supabase = createAdminClient();

    console.log("Testing company_name column...");

    // Test 1: Try to select the column
    const { data, error } = await supabase
      .from("providers")
      .select("id, first_name, last_name, email, company_name")
      .limit(1);

    if (error) {
      console.log("Column NOT accessible:", error.message);

      // Try to reload schema
      const { error: reloadError } = await supabase.rpc("reload_postgrest_schema");

      return NextResponse.json({
        accessible: false,
        error: error.message,
        reloadAttempted: true,
        reloadError: reloadError?.message || null,
        message: "Column not accessible. Schema reload triggered. Wait 10 seconds and try inviting a provider again."
      });
    }

    return NextResponse.json({
      accessible: true,
      message: "company_name column is accessible!",
      sample: data
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
