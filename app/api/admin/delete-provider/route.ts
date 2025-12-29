import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";

/**
 * Delete a provider by email (admin access)
 * DELETE /api/admin/delete-provider?email=provider@example.com
 */
export async function DELETE(request: Request) {
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

    const isAdmin = userRole?.role === "admin";
    const email = user.email || "";
    const isPlatformOwner =
      email.endsWith("@smartconnects.com") ||
      email === "joseph@smartconnects.com" ||
      email === "h.alkhammal@gmail.com" ||
      email === "platform@demo.com";

    if (!isAdmin && !isPlatformOwner) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Get email from query params
    const { searchParams } = new URL(request.url);
    const emailToDelete = searchParams.get("email");

    if (!emailToDelete) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // First, find the provider by email to get their user_id
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("user_id")
      .eq("email", emailToDelete)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { success: false, error: `Provider with email ${emailToDelete} not found` },
        { status: 404 }
      );
    }

    const userIdToDelete = provider.user_id;

    // Verify the user exists in auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userIdToDelete);

    if (authError || !authUser.user) {
      return NextResponse.json(
        { success: false, error: `Auth user not found for provider ${emailToDelete}` },
        { status: 404 }
      );
    }

    // Delete the user from auth (this will cascade delete related records via database triggers/policies)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete user", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted provider: ${emailToDelete} (ID: ${userIdToDelete})`,
    });
  } catch (error) {
    console.error("Error in delete provider:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete provider",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
