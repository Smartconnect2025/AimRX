import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";

/**
 * Test provider login credentials (admin access)
 * POST /api/admin/test-provider-login
 * Body: { email: string, password: string }
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
    const { email: testEmail, password: testPassword } = body;

    if (!testEmail || !testPassword) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("🔍 Testing login for:", testEmail);
    console.log("🔍 Password length:", testPassword.length);

    // First verify the user exists
    const { data: provider } = await supabase
      .from("providers")
      .select("user_id")
      .eq("email", testEmail)
      .single();

    if (!provider) {
      return NextResponse.json({
        success: false,
        error: "Provider not found in database",
      });
    }

    // Get full auth user details
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(provider.user_id);

    if (authError || !authUser.user) {
      return NextResponse.json({
        success: false,
        error: "Auth user not found",
        details: authError?.message,
      });
    }

    console.log("📋 Auth user details:", {
      id: authUser.user.id,
      email: authUser.user.email,
      email_confirmed_at: authUser.user.email_confirmed_at,
      banned_until: authUser.user.banned_until,
      deleted_at: authUser.user.deleted_at,
      is_anonymous: authUser.user.is_anonymous,
      created_at: authUser.user.created_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
    });

    // Try to sign in using admin client (this should bypass any restrictions)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error("❌ Sign in error:", signInError);
      return NextResponse.json({
        success: false,
        error: "Login failed",
        signInError: {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name,
        },
        authUser: {
          id: authUser.user.id,
          email: authUser.user.email,
          email_confirmed_at: authUser.user.email_confirmed_at,
          banned_until: authUser.user.banned_until,
        },
      });
    }

    console.log("✅ Sign in successful!");

    return NextResponse.json({
      success: true,
      message: "Login test successful",
      user: {
        id: signInData.user?.id,
        email: signInData.user?.email,
      },
    });
  } catch (error) {
    console.error("Error in test provider login:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test login",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
