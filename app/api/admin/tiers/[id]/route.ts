/**
 * Admin Tier Management API
 *
 * Endpoint for admin users to update or delete specific tiers
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { mockTierStore } from "../mock-store";

// TODO: Replace mock store with actual database after running migrations

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

    // Using mock store temporarily
    try {
      const updateData: {
        tier_name?: string;
        tier_code?: string;
        discount_percentage?: number;
        description?: string;
      } = {};

      if (tierName) updateData.tier_name = tierName;
      if (tierCode) updateData.tier_code = tierCode.toLowerCase().replace(/\s+/g, '');
      if (discountPercentage !== undefined) updateData.discount_percentage = parseFloat(discountPercentage);
      if (description !== undefined) updateData.description = description;

      const tier = mockTierStore.update(params.id, updateData);

      return NextResponse.json({
        success: true,
        tier,
        message: "Tier updated successfully",
      });
    } catch (storeError) {
      if (storeError instanceof Error) {
        if (storeError.message.includes("already exists")) {
          return NextResponse.json(
            { error: "A tier with this name or code already exists" },
            { status: 409 },
          );
        }
        if (storeError.message.includes("not found")) {
          return NextResponse.json(
            { error: "Tier not found" },
            { status: 404 },
          );
        }
      }

      throw storeError;
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

    // Using mock store temporarily
    // TODO: Add check for providers using this tier after database migration

    try {
      mockTierStore.delete(params.id);

      return NextResponse.json({
        success: true,
        message: "Tier deleted successfully",
      });
    } catch (storeError) {
      if (storeError instanceof Error && storeError.message.includes("not found")) {
        return NextResponse.json(
          { error: "Tier not found" },
          { status: 404 },
        );
      }

      throw storeError;
    }
  } catch (error) {
    console.error("Error deleting tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
