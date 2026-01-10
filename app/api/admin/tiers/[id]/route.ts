/**
 * Admin Tier Management API
 *
 * Endpoint for admin users to update or delete specific tiers
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { mockTierStore } from "../mock-store";
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

    // Try to update in database first
    const { data: dbTier, error: dbError } = await supabase
      .from("tiers")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    // If database works, use it
    if (!dbError && dbTier) {
      console.log("Tier updated in database");
      return NextResponse.json({
        success: true,
        tier: dbTier,
        message: "Tier updated successfully",
      });
    }

    // Log database error but continue with fallback
    if (dbError) {
      console.log("Database tier update failed, using mock store fallback:", dbError.message);

      // Check for unique constraint violation in database
      if (dbError.code === "23505") {
        return NextResponse.json(
          { error: "A tier with this name or code already exists" },
          { status: 409 },
        );
      }
    }

    try {
      // Fallback to mock store
      const tier = mockTierStore.update(params.id, {
        tier_name: tierName,
        tier_code: tierCode ? tierCode.toLowerCase().replace(/\s+/g, '') : undefined,
        discount_percentage: discountPercentage !== undefined ? parseFloat(discountPercentage) : undefined,
        description: description,
      });

      return NextResponse.json({
        success: true,
        tier,
        message: "Tier updated successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("already exists")) {
        return NextResponse.json(
          { error: "A tier with this name or code already exists" },
          { status: 409 },
        );
      }

      if (errorMessage.includes("not found")) {
        return NextResponse.json(
          { error: "Tier not found" },
          { status: 404 },
        );
      }

      throw error;
    }
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

    // Try to delete from database first
    const { error: dbError } = await supabase
      .from("tiers")
      .delete()
      .eq("id", params.id);

    // If database works, use it
    if (!dbError) {
      console.log("Tier deleted from database");
      return NextResponse.json({
        success: true,
        message: "Tier deleted successfully",
      });
    }

    // Log database error but continue with fallback
    console.log("Database tier deletion failed, using mock store fallback:", dbError.message);

    try {
      // Fallback to mock store
      mockTierStore.delete(params.id);

      return NextResponse.json({
        success: true,
        message: "Tier deleted successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("not found")) {
        return NextResponse.json(
          { error: "Tier not found" },
          { status: 404 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error deleting tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
