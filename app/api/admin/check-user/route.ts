import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * POST /api/admin/check-user
 * Checks if a user exists in auth and their status
 * Requires: Platform owner access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // List all users and find by email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: "Failed to list users", details: listError.message },
        { status: 500 }
      );
    }

    const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: "User not found in auth.users"
      });
    }

    // Check user_roles
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Check providers table
    const { data: providerData, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("id, email, first_name, last_name, is_active")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        banned: user.banned_until,
      },
      role: roleData?.role || null,
      roleError: roleError?.message || null,
      provider: providerData || null,
      providerError: providerError?.message || null,
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
