import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@core/auth";

export async function POST(request: NextRequest) {
  const { user, userRole } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, email, newPassword } = body;

    // Validate required fields
    if (!userId || !email || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createAdminClient();

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to reset password" },
        { status: 500 }
      );
    }

    // Send email with new password (in a real app, you'd use a proper email service)
    // For now, we'll just return success
    // TODO: Integrate with email service to send new credentials

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully",
        email: email,
        newPassword: newPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
