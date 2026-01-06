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
    console.log("Looking for provider with email:", emailToDelete);
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("user_id")
      .eq("email", emailToDelete)
      .single();

    if (providerError) {
      console.error("Error finding provider:", providerError);
      return NextResponse.json(
        { success: false, error: `Provider with email ${emailToDelete} not found`, details: providerError.message },
        { status: 404 }
      );
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, error: `Provider with email ${emailToDelete} not found` },
        { status: 404 }
      );
    }

    console.log("Found provider with user_id:", provider.user_id);

    const userIdToDelete = provider.user_id;

    // Verify the user exists in auth
    console.log("Verifying auth user exists with ID:", userIdToDelete);
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userIdToDelete);

    if (authError) {
      console.error("Error fetching auth user:", authError);
      return NextResponse.json(
        { success: false, error: `Auth user not found for provider ${emailToDelete}`, details: authError.message },
        { status: 404 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { success: false, error: `Auth user not found for provider ${emailToDelete}` },
        { status: 404 }
      );
    }

    console.log("Auth user found, proceeding with deletion...");

    // Before deleting auth user, delete all related records manually to avoid constraint issues
    console.log("Deleting related records for user:", userIdToDelete);

    // Delete from providers table first
    const { error: providerDeleteError } = await supabase
      .from("providers")
      .delete()
      .eq("user_id", userIdToDelete);

    if (providerDeleteError) {
      console.error("Error deleting provider record:", providerDeleteError);
    }

    // Delete from user_roles table
    const { error: roleDeleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userIdToDelete);

    if (roleDeleteError) {
      console.error("Error deleting user role:", roleDeleteError);
    }

    // Delete from pharmacy_admins table if exists
    const { error: adminDeleteError } = await supabase
      .from("pharmacy_admins")
      .delete()
      .eq("user_id", userIdToDelete);

    if (adminDeleteError) {
      console.error("Error deleting pharmacy admin link:", adminDeleteError);
    }

    // Delete from provider_pharmacy_links table if exists
    const { error: linkDeleteError } = await supabase
      .from("provider_pharmacy_links")
      .delete()
      .eq("provider_id", userIdToDelete);

    if (linkDeleteError) {
      console.error("Error deleting provider pharmacy links:", linkDeleteError);
    }

    // Finally, delete the user from auth
    console.log("Deleting auth user:", userIdToDelete);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete user", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("✅ Successfully deleted provider:", emailToDelete);
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
