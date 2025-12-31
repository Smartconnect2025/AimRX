import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";

/**
 * Approve or reject an access request
 * PATCH /api/access-requests/[id]
 * Body: { action: 'approve' | 'reject', rejectionReason?: string, password?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const supabaseAdmin = await createAdminClient();
    const requestId = params.id;

    // Check authentication
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

    // Parse request body
    const body = await request.json();
    const { action, rejectionReason, password } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the access request
    const { data: accessRequest, error: fetchError } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !accessRequest) {
      return NextResponse.json(
        { success: false, error: "Access request not found" },
        { status: 404 }
      );
    }

    if (accessRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Request has already been ${accessRequest.status}` },
        { status: 400 }
      );
    }

    if (action === "reject") {
      // Update request status to rejected
      const { error: updateError } = await supabaseAdmin
        .from("access_requests")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating access request:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to reject request" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Access request rejected successfully",
      });
    }

    // Handle approval - create provider account
    if (action === "approve") {
      if (accessRequest.type !== "doctor") {
        return NextResponse.json(
          { success: false, error: "Only doctor requests can be approved currently" },
          { status: 400 }
        );
      }

      // Check if provider password was provided
      if (!password) {
        return NextResponse.json(
          { success: false, error: "Password is required for approval" },
          { status: 400 }
        );
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUser?.users?.some((u: { email?: string }) => u.email === accessRequest.email);

      if (userExists) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists" },
          { status: 400 }
        );
      }

      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: accessRequest.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: accessRequest.first_name,
          last_name: accessRequest.last_name,
          role: "provider",
        },
      });

      if (authError || !authUser.user) {
        console.error("Error creating auth user:", authError);
        return NextResponse.json(
          { success: false, error: authError?.message || "Failed to create user account" },
          { status: 500 }
        );
      }

      // Create user_roles record
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: authUser.user.id,
        role: "provider",
      });

      if (roleError) {
        console.error("Error creating user role:", roleError);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json(
          { success: false, error: "Failed to create user role" },
          { status: 500 }
        );
      }

      // Create provider record
      const { error: providerError } = await supabaseAdmin.from("providers").insert({
        user_id: authUser.user.id,
        first_name: accessRequest.first_name,
        last_name: accessRequest.last_name,
        phone_number: accessRequest.phone || null,
        email: accessRequest.email,
      });

      if (providerError) {
        console.error("Error creating provider record:", providerError);
        await supabaseAdmin.from("user_roles").delete().eq("user_id", authUser.user.id);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json(
          { success: false, error: "Failed to create provider record" },
          { status: 500 }
        );
      }

      // Update access request status
      const { error: updateError } = await supabaseAdmin
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating access request:", updateError);
      }

      return NextResponse.json({
        success: true,
        message: "Provider account created successfully",
        provider: {
          id: authUser.user.id,
          email: accessRequest.email,
          name: `${accessRequest.first_name} ${accessRequest.last_name}`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing access request action:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
