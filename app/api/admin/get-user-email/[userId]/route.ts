import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      console.error("get-user-email: No userId provided");
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("get-user-email: Fetching email for userId:", userId);

    const supabaseAdmin = createAdminClient();

    // Get user email from auth.users
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !data.user) {
      console.error("get-user-email: User not found or error:", error);
      return NextResponse.json(
        { error: "User not found", details: error?.message },
        { status: 404 }
      );
    }

    console.log("get-user-email: Successfully fetched email for userId:", userId);

    return NextResponse.json(
      {
        data: {
          email: data.user.email || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
