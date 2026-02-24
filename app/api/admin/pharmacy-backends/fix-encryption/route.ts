import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";
import { encryptApiKey, isEncrypted } from "@core/security/encryption";

/**
 * POST /api/admin/pharmacy-backends/fix-encryption
 * Re-encrypts a pharmacy backend API key with the current encryption key
 * This fixes "Failed to decrypt API key" errors caused by encryption key mismatches
 */
export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { backendId, newApiKey } = await request.json();

    if (!backendId || !newApiKey) {
      return NextResponse.json(
        { success: false, error: "Backend ID and new API key are required" },
        { status: 400 }
      );
    }

    // Validate that the backend exists
    const { data: backend, error: backendError } = await supabase
      .from("pharmacy_backends")
      .select("id, pharmacy_id, system_type")
      .eq("id", backendId)
      .single();

    if (backendError || !backend) {
      return NextResponse.json(
        { success: false, error: "Backend not found" },
        { status: 404 }
      );
    }

    // Encrypt the new API key
    const encryptedApiKey = encryptApiKey(newApiKey);

    // Update the pharmacy backend with the new encrypted key
    const { error: updateError } = await supabase
      .from("pharmacy_backends")
      .update({
        api_key_encrypted: encryptedApiKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", backendId);

    if (updateError) {
      console.error("Error updating pharmacy backend:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update pharmacy backend",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log this action for audit purposes
    await supabase.from("system_logs").insert({
      user_id: user.id,
      user_email: user.email || "unknown@example.com",
      user_name: user.email?.split("@")[0] || "Admin",
      action: "API_KEY_RE_ENCRYPTED",
      details: `Admin re-encrypted API key for pharmacy backend ${backendId}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "API key re-encrypted successfully",
      backendId,
    });
  } catch (error) {
    console.error("Error fixing encryption:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fix encryption",
      },
      { status: 500 }
    );
  }
}
