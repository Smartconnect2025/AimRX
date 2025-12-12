import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";

/**
 * Create a new pharmacy admin
 * POST /api/admin/pharmacy-admins
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

    // Parse request body
    const body = await request.json();
    const { email, password, pharmacy_id, full_name } = body;

    // Validate required fields
    if (!email || !password || !pharmacy_id) {
      return NextResponse.json(
        { success: false, error: "Email, password, and pharmacy_id are required" },
        { status: 400 }
      );
    }

    // 1. Create auth user via Supabase Admin API (using admin client with service role key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || email.split("@")[0],
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);

      // Check if it's a duplicate user error
      const isDuplicate = authError?.message?.includes("already") || authError?.message?.includes("exists");

      return NextResponse.json(
        {
          success: false,
          error: isDuplicate
            ? "A user with this email already exists. Please use a different email address."
            : "Failed to create user account",
          details: authError?.message || "Unknown error",
        },
        { status: isDuplicate ? 400 : 500 }
      );
    }

    const userId = authData.user.id;

    // 2. Add user_roles entry (role="admin")
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin",
      });

    if (roleError) {
      console.error("Error creating user role:", roleError);
      // Continue anyway - pharmacy_admins table is enough
    }

    // 3. Add pharmacy_admins link
    const { error: linkError } = await supabase
      .from("pharmacy_admins")
      .insert({
        user_id: userId,
        pharmacy_id,
      });

    if (linkError) {
      console.error("Error linking user to pharmacy:", linkError);
      // Cleanup: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to link user to pharmacy",
          details: linkError.message,
        },
        { status: 500 }
      );
    }

    // 4. Get pharmacy details for response
    const { data: pharmacy } = await supabase
      .from("pharmacies")
      .select("name, slug")
      .eq("id", pharmacy_id)
      .single();

    return NextResponse.json({
      success: true,
      message: `Pharmacy admin created successfully for ${pharmacy?.name || "pharmacy"}`,
      user: {
        id: userId,
        email,
        pharmacy: pharmacy?.name,
      },
    });
  } catch (error) {
    console.error("Error in create pharmacy admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create pharmacy admin",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get all pharmacy admins
 * GET /api/admin/pharmacy-admins
 */
export async function GET() {
  const supabase = await createServerClient();
  const supabaseAdmin = await createAdminClient();

  try {
    // Get all pharmacy admin links with user and pharmacy details
    const { data: adminLinks, error } = await supabase
      .from("pharmacy_admins")
      .select(`
        user_id,
        pharmacy_id,
        pharmacy:pharmacies(name, slug, primary_color)
      `);

    if (error) {
      console.error("Error fetching pharmacy admins:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch pharmacy admins" },
        { status: 500 }
      );
    }

    // Get user details for each admin
    const adminsWithDetails = await Promise.all(
      (adminLinks || []).map(async (link) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(link.user_id);
        return {
          user_id: link.user_id,
          email: userData?.user?.email || "Unknown",
          pharmacy_id: link.pharmacy_id,
          pharmacy: link.pharmacy,
        };
      })
    );

    return NextResponse.json({
      success: true,
      admins: adminsWithDetails,
    });
  } catch (error) {
    console.error("Error in get pharmacy admins:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pharmacy admins",
      },
      { status: 500 }
    );
  }
}
