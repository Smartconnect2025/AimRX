/**
 * Admin Tier Management API
 *
 * Endpoint for admin users to update or delete specific tiers
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { mockTierStore } from "../mock-store";

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

    try {
      // Update tier in mock store
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

    try {
      // Delete tier from mock store
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
