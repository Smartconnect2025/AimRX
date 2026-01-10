/**
 * Admin Tier Management API
 *
 * Endpoint for admin users to update or delete specific tiers
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
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { tierName, tierCode, discountPercentage, description } = body;

    // Validate discount percentage if provided
    if (discountPercentage !== undefined) {
      const discount = parseFloat(discountPercentage);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return NextResponse.json(
          { error: "Discount percentage must be between 0 and 100" },
          { status: 400 },
        );
      }
    }

    const supabase = await createServerClient();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (tierName) updateData.tier_name = tierName;
    if (tierCode) updateData.tier_code = tierCode.toLowerCase().replace(/\s+/g, '');
    if (discountPercentage !== undefined) updateData.discount_percentage = parseFloat(discountPercentage);
    if (description !== undefined) updateData.description = description;
    updateData.updated_at = new Date().toISOString();

    // Update tier in database
    const { data: tier, error } = await supabase
      .from("tiers")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tier:", error);

      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A tier with this name or code already exists" },
          { status: 409 },
        );
      }

      // Check for not found
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Tier not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: "Failed to update tier" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      tier,
      message: "Tier updated successfully",
    });
  } catch (error) {
    console.error("Error updating tier:", error);
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
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const supabase = await createServerClient();

    // Check if tier exists
    const { data: existingTier, error: fetchError } = await supabase
      .from("tiers")
      .select("id")
      .eq("id", params.id)
      .single();

    if (fetchError || !existingTier) {
      return NextResponse.json(
        { error: "Tier not found" },
        { status: 404 },
      );
    }

    // Delete tier from database
    const { error } = await supabase
      .from("tiers")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting tier:", error);
      return NextResponse.json(
        { error: "Failed to delete tier" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tier deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
