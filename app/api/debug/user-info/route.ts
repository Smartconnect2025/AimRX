import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all demo users with their roles
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const demoUsers = authUsers.users.filter(u => u.email?.endsWith("@demo.com"));

    const userInfo = await Promise.all(
      demoUsers.map(async (user) => {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        return {
          id: user.id,
          email: user.email,
          roleInDatabase: roleData?.role || "NO ROLE",
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: userInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
