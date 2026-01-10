/**
 * Admin Tiers API
 *
 * Endpoint for admin users to manage tier levels and discount percentages
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { mockTierStore } from "./mock-store";

export async function GET() {
  try {
    // Check if the current user is an admin
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    // Get all tiers from mock store
    const tiers = mockTierStore.getAll();

    return NextResponse.json({
      tiers: tiers || [],
      total: tiers?.length || 0,
    });
  } catch (error) {
    console.error("Error listing tiers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!tierName || !tierCode || discountPercentage === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: tierName, tierCode, discountPercentage" },
        { status: 400 },
      );
    }

    // Validate discount percentage
    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return NextResponse.json(
        { error: "Discount percentage must be between 0 and 100" },
        { status: 400 },
      );
    }

    try {
      // Create tier in mock store
      const tier = mockTierStore.create({
        tier_name: tierName,
        tier_code: tierCode.toLowerCase().replace(/\s+/g, ''),
        discount_percentage: discount,
        description: description || undefined,
      });

      return NextResponse.json({
        success: true,
        tier,
        message: "Tier created successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("already exists")) {
        return NextResponse.json(
          { error: "A tier with this name or code already exists" },
          { status: 409 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error creating tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
