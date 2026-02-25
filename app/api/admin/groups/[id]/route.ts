/**
 * Admin Group Management API
 *
 * Endpoint for admin users to update or delete specific groups
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createServerClient } from "@core/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, platformManager } = body;

    const supabase = await createServerClient();

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (platformManager !== undefined)
      updateData.platform_manager = platformManager || null;
    updateData.updated_at = new Date().toISOString();

    const { data: dbGroup, error: dbError } = await supabase
      .from("groups")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Group not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to update group. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      group: dbGroup,
      message: "Group updated successfully",
    });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const supabase = await createServerClient();

    const { error: fetchError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Group not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to delete group. Please try again." },
        { status: 500 },
      );
    }

    const { error: dbError } = await supabase
      .from("groups")
      .delete()
      .eq("id", params.id);

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to delete group. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
