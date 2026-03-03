import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";

/**
 * Reset a provider's password (admin access)
 * POST /api/admin/reset-provider-password
 * Body: { email: string, newPassword: string }
 */
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const supabaseAdmin = await createAdminClient();

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

    // Check if user has admin role
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

    // Parse request body
    const body = await request.json();
    const { email: providerEmail, newPassword } = body;

    if (!providerEmail || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email and newPassword are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Find the provider by email to get their user_id
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("user_id, first_name, last_name")
      .eq("email", providerEmail)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: `Provider with email ${providerEmail} not found` },
        { status: 404 }
      );
    }

    const userIdToUpdate = provider.user_id;

    // Update the user's password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userIdToUpdate,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update password", details: updateError.message },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      message: `Password successfully reset for Dr. ${provider.first_name} ${provider.last_name}`,
      email: providerEmail,
    });
  } catch (error) {
    console.error("Error in reset provider password:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset password",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
