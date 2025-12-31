import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Fix platform@demo.com user role
 * This endpoint assigns the admin role to the platform owner account
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get platform user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", "platform@demo.com")
      .single();

    if (userError || !user) {
      // Try auth.users table instead
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const platformUser = authUsers.users.find(
        (u) => u.email === "platform@demo.com"
      );

      if (!platformUser) {
        return NextResponse.json(
          { success: false, error: "Platform user not found" },
          { status: 404 }
        );
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", platformUser.id)
        .single();

      if (existingRole) {
        return NextResponse.json({
          success: true,
          message: "Platform user already has a role",
          role: existingRole.role,
        });
      }

      // Insert admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: platformUser.id,
          role: "admin",
        });

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Admin role assigned to platform@demo.com",
        userId: platformUser.id,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Unexpected error",
    });
  } catch (error) {
    console.error("Error fixing platform role:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
