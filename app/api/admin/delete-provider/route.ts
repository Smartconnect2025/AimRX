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

    if (userRole?.role !== "admin") {
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


    const userIdToDelete = provider.user_id;

    // Verify the user exists in auth
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


    // Before deleting auth user, delete all related records manually to avoid constraint issues

    // First, get the provider ID (different from user_id)
    const { data: providerRecord } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", userIdToDelete)
      .single();

    const providerId = providerRecord?.id;

    // Delete encounters first (references provider_id)
    if (providerId) {
      const { error: encountersError } = await supabase
        .from("encounters")
        .delete()
        .eq("provider_id", providerId);

      if (encountersError) {
        console.error("Error deleting encounters:", encountersError);
      } else {
      }
    }

    // Delete patients assigned to this provider
    if (providerId) {
      const { error: patientsError } = await supabase
        .from("patients")
        .delete()
        .eq("provider_id", providerId);

      if (patientsError) {
        console.error("Error deleting patients:", patientsError);
      } else {
      }
    }

    // Delete from provider_pharmacy_links table if exists
    const { error: linkDeleteError } = await supabase
      .from("provider_pharmacy_links")
      .delete()
      .eq("provider_id", userIdToDelete);

    if (linkDeleteError) {
      console.error("Error deleting provider pharmacy links:", linkDeleteError);
    }

    // Delete from pharmacy_admins table if exists
    const { error: adminDeleteError } = await supabase
      .from("pharmacy_admins")
      .delete()
      .eq("user_id", userIdToDelete);

    if (adminDeleteError) {
      console.error("Error deleting pharmacy admin link:", adminDeleteError);
    }

    // Delete from providers table
    const { error: providerDeleteError } = await supabase
      .from("providers")
      .delete()
      .eq("user_id", userIdToDelete);

    if (providerDeleteError) {
      console.error("Error deleting provider record:", providerDeleteError);
    } else {
    }

    // Delete from user_roles table
    const { error: roleDeleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userIdToDelete);

    if (roleDeleteError) {
      console.error("Error deleting user role:", roleDeleteError);
    } else {
    }

    // Finally, delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
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
