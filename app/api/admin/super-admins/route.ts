import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@core/supabase/server";
import { getUser } from "@core/auth";

export async function GET() {
  const { user, userRole } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const supabaseAdmin = createAdminClient();

    const { data: adminRoles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at")
      .eq("role", "admin");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
    }

    const admins = await Promise.all(
      (adminRoles || []).map(async (role) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(role.user_id);

        const { data: pharmacyLinks } = await supabaseAdmin
          .from("pharmacy_admins")
          .select("pharmacy_id, pharmacies(name, slug)")
          .eq("user_id", role.user_id);

        return {
          user_id: role.user_id,
          email: userData?.user?.email || "Unknown",
          full_name: userData?.user?.user_metadata?.full_name || userData?.user?.user_metadata?.first_name
            ? `${userData?.user?.user_metadata?.first_name || ""} ${userData?.user?.user_metadata?.last_name || ""}`.trim()
            : null,
          created_at: userData?.user?.created_at || role.created_at,
          last_sign_in: userData?.user?.last_sign_in_at || null,
          pharmacies: pharmacyLinks || [],
        };
      })
    );

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error("Error fetching super admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { user, userRole } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || email.split("@")[0],
      },
    });

    if (authError || !authData.user) {
      const isDuplicate =
        authError?.code === "user_already_exists" ||
        authError?.code === "email_exists" ||
        (authError as { status?: number })?.status === 422 ||
        authError?.message?.toLowerCase().includes("already") ||
        authError?.message?.toLowerCase().includes("exists");

      return NextResponse.json(
        { error: isDuplicate ? "A user with this email already exists" : authError?.message || "Failed to create user" },
        { status: isDuplicate ? 400 : 500 }
      );
    }

    const userId = authData.user.id;

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to assign admin role" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Super admin created successfully",
      admin: {
        user_id: userId,
        email,
        full_name: full_name || null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating super admin:", error);
    return NextResponse.json(
      { error: "Failed to create super admin", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { user, userRole } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    if (user_id === user.id) {
      return NextResponse.json({ error: "You cannot remove your own admin access" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", user_id)
      .eq("role", "admin");

    await supabaseAdmin
      .from("pharmacy_admins")
      .delete()
      .eq("user_id", user_id);

    return NextResponse.json({
      success: true,
      message: "Admin access removed successfully",
    });
  } catch (error) {
    console.error("Error removing super admin:", error);
    return NextResponse.json(
      { error: "Failed to remove admin", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
