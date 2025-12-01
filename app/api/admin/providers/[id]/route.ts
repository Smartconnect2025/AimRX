/**
 * Admin Provider Update API
 *
 * Endpoint for admin users to update provider data
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createAdminClient } from "@core/database/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const supabase = createAdminClient();

    // Update provider
    const { error } = await supabase
      .from("providers")
      .update(body)
      .eq("id", id);

    if (error) {
      console.error("Error updating provider:", error);
      return NextResponse.json(
        { error: "Failed to update provider" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
