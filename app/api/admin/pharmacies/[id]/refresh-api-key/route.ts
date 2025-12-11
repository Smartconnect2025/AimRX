import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";
import crypto from "crypto";

/**
 * Refresh API key for a pharmacy's backend integration
 * POST /api/admin/pharmacies/[id]/refresh-api-key
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();

  try {
    // Get current user
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

    // Check if user is platform owner
    const email = user.email?.toLowerCase() || "";
    const isPlatformOwner =
      email.endsWith("@smartconnects.com") ||
      email === "joseph@smartconnects.com" ||
      email === "demo+admin@specode.ai" ||
      email === "platform@demo.com";

    if (!isPlatformOwner) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Platform owner access required" },
        { status: 403 }
      );
    }

    const pharmacyId = params.id;

    // Verify pharmacy exists
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from("pharmacies")
      .select("id, name")
      .eq("id", pharmacyId)
      .single();

    if (pharmacyError || !pharmacy) {
      return NextResponse.json(
        { success: false, error: "Pharmacy not found" },
        { status: 404 }
      );
    }

    // Generate new API key (32 bytes = 64 hex characters)
    const newApiKey = crypto.randomBytes(32).toString("hex");

    // Update the pharmacy backend with new API key
    const { data: backend, error: updateError } = await supabase
      .from("pharmacy_backends")
      .update({
        api_key_encrypted: newApiKey, // TODO: Encrypt in production
        updated_at: new Date().toISOString(),
      })
      .eq("pharmacy_id", pharmacyId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating API key:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to refresh API key",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from("system_logs").insert({
      user_email: user.email || "unknown",
      user_name: "Platform Owner",
      action: "API_KEY_REFRESH",
      details: `API key refreshed for pharmacy: ${pharmacy.name}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `API key refreshed successfully for ${pharmacy.name}`,
      apiKey: newApiKey,
      backend,
    });
  } catch (error) {
    console.error("Error in refresh API key:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh API key",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
