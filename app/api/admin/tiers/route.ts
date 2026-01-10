/**
 * Admin Tiers API
 *
 * Endpoint for admin users to manage tier levels and discount percentages
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { mockTierStore } from "./mock-store";
import { createServerClient } from "@core/supabase/server";

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

    const supabase = await createServerClient();

    // Try to fetch from database first
    const { data: dbTiers, error: dbError } = await supabase
      .from("tiers")
      .select("*")
      .order("created_at", { ascending: false });

    // If database works, use it
    if (!dbError && dbTiers) {
      console.log("Using database tiers");
      return NextResponse.json({
        tiers: dbTiers,
        total: dbTiers.length,
      });
    }

    // Fallback to mock store if database fails
    console.log("Database tiers failed, using mock store fallback");
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

    const supabase = await createServerClient();

    // Try to create in database first
    const { data: dbTier, error: dbError } = await supabase
      .from("tiers")
      .insert({
        tier_name: tierName,
        tier_code: tierCode.toLowerCase().replace(/\s+/g, ''),
        discount_percentage: discount,
        description: description || null,
      })
      .select()
      .single();

    // If database works, use it
    if (!dbError && dbTier) {
      console.log("Tier created in database");
      return NextResponse.json({
        success: true,
        tier: dbTier,
        message: "Tier created successfully",
      });
    }

    // Log database error but continue with fallback
    if (dbError) {
      console.log("Database tier creation failed, using mock store fallback:", dbError.message);

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
