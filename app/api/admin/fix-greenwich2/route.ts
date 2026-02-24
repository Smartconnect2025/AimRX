import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Emergency fix for Greenwich 2 pharmacy
 * Sets the API key to plain text so the system can use it
 */
export async function POST() {
  const supabase = await createServerClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find Greenwich 2 pharmacy
    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("id, name")
      .ilike("name", "%greenwich%2%")
      .single();

    if (!pharmacy) {
      return NextResponse.json(
        { success: false, error: "Greenwich 2 pharmacy not found" },
        { status: 404 }
      );
    }

    // Find backend
    const { data: backend } = await supabase
      .from("pharmacy_backends")
      .select("id")
      .eq("pharmacy_id", pharmacy.id)
      .single();

    if (!backend) {
      return NextResponse.json(
        { success: false, error: "Greenwich 2 backend not found" },
        { status: 404 }
      );
    }

    // Update with plain text API key
    const { error: updateError } = await supabase
      .from("pharmacy_backends")
      .update({
        api_key_encrypted: "DEF9A8F1-AD18-69D5-EB7A-D71B1996B4E1",
        updated_at: new Date().toISOString(),
      })
      .eq("id", backend.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Greenwich 2 API key updated to plain text. System will handle it correctly.",
      pharmacy: pharmacy.name,
      backendId: backend.id,
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
