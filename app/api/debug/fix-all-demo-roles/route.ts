import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all demo users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const demoUsers = authUsers.users.filter(u => u.email?.endsWith("@demo.com"));

    const roleAssignments = [
      { email: "platform@demo.com", role: "admin" },
      { email: "admin@demo.com", role: "admin" },
      { email: "dr.smith@demo.com", role: "provider" },
      { email: "dr.jones@demo.com", role: "provider" },
    ];

    const results = [];

    for (const assignment of roleAssignments) {
      const user = demoUsers.find(u => u.email === assignment.email);
      if (!user) {
        results.push({ email: assignment.email, status: "user not found" });
        continue;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: assignment.role })
          .eq("user_id", user.id);

        results.push({
          email: assignment.email,
          userId: user.id,
          status: error ? `update failed: ${error.message}` : "updated",
          role: assignment.role,
        });
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: assignment.role,
          });

        results.push({
          email: assignment.email,
          userId: user.id,
          status: error ? `insert failed: ${error.message}` : "inserted",
          role: assignment.role,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo user roles assigned",
      results,
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
