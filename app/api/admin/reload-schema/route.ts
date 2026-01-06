import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@core/supabase/server";

/**
 * POST /api/admin/reload-schema
 * Reloads the PostgREST schema cache to recognize new columns
 * Requires: Platform owner access
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform owner (admin role)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Platform owner access required" },
        { status: 403 }
      );
    }

    // Send NOTIFY command to PostgREST to reload schema
    const { error: notifyError } = await supabase.rpc("reload_postgrest_schema");

    if (notifyError) {
      console.error("Error reloading schema:", notifyError);

      // If the RPC doesn't exist, try alternative method
      // Execute raw SQL to send NOTIFY
      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql: "NOTIFY pgrst, 'reload schema'",
      });

      if (sqlError) {
        console.error("Error with SQL exec:", sqlError);
        return NextResponse.json(
          {
            error: "Failed to reload schema",
            details: notifyError.message,
            suggestion:
              "Schema cache may require manual refresh. Contact database admin or wait for automatic refresh (typically 1-5 minutes).",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Schema cache reload requested. Changes should be available within 1-2 minutes.",
    });
  } catch (error) {
    console.error("Unexpected error reloading schema:", error);
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
