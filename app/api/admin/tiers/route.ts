/**
 * Admin Tiers API
 *
 * Endpoint for admin users to manage tier levels and discount percentages
 * Only accessible to users with admin role
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@core/auth";
import { createServerClient } from "@core/supabase/server";
import postgres from "postgres";

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

    // Fetch tiers from database
    const { data: tiers, error } = await supabase
      .from("tiers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tiers:", error);
      console.error("Supabase error details:", JSON.stringify(error, null, 2));

      // If table doesn't exist (code 42P01), try to initialize it
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.log("Tiers table doesn't exist, attempting to create it...");

        try {
          const databaseUrl = process.env.DATABASE_URL;
          if (!databaseUrl) {
            return NextResponse.json(
              { error: "Database URL not configured" },
              { status: 500 },
            );
          }

          // Create direct postgres connection for DDL operations
          const sql = postgres(databaseUrl);

          try {
            // Create the tiers table
            await sql.unsafe(`
              CREATE TABLE IF NOT EXISTS tiers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tier_name TEXT NOT NULL UNIQUE,
                tier_code TEXT NOT NULL UNIQUE,
                discount_percentage NUMERIC(5,2) NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );
            `);

            // Insert default tiers
            await sql.unsafe(`
              INSERT INTO tiers (tier_name, tier_code, discount_percentage, description) VALUES
                ('Tier 1', 'tier1', 10.00, 'Basic tier with 10% discount'),
                ('Tier 2', 'tier2', 15.00, 'Standard tier with 15% discount'),
                ('Tier 3', 'tier3', 20.00, 'Premium tier with 20% discount')
              ON CONFLICT (tier_code) DO NOTHING;
            `);

            await sql.end();

            console.log("✅ Tiers table created successfully");

            // Retry fetching tiers
            const { data: newTiers, error: retryError } = await supabase
              .from("tiers")
              .select("*")
              .order("created_at", { ascending: false });

            if (!retryError) {
              return NextResponse.json({
                tiers: newTiers || [],
                total: newTiers?.length || 0,
              });
            }
          } catch (createError) {
            await sql.end();
            console.error("Failed to create tiers table:", createError);
          }
        } catch (initError) {
          console.error("Failed to auto-initialize tiers table:", initError);
        }
      }

      return NextResponse.json(
        { error: "Failed to fetch tiers", details: error.message },
        { status: 500 },
      );
    }

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

    // Create tier in database
    const { data: tier, error } = await supabase
      .from("tiers")
      .insert({
        tier_name: tierName,
        tier_code: tierCode.toLowerCase().replace(/\s+/g, ''),
        discount_percentage: discount,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tier:", error);

      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A tier with this name or code already exists" },
          { status: 409 },
        );
      }

      // If table doesn't exist, create it and retry
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.log("Tiers table doesn't exist, creating it...");

        try {
          const databaseUrl = process.env.DATABASE_URL;
          if (!databaseUrl) {
            return NextResponse.json(
              { error: "Database URL not configured" },
              { status: 500 },
            );
          }

          const sql = postgres(databaseUrl);

          try {
            // Create the tiers table
            await sql.unsafe(`
              CREATE TABLE IF NOT EXISTS tiers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tier_name TEXT NOT NULL UNIQUE,
                tier_code TEXT NOT NULL UNIQUE,
                discount_percentage NUMERIC(5,2) NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );
            `);

            // Insert default tiers
            await sql.unsafe(`
              INSERT INTO tiers (tier_name, tier_code, discount_percentage, description) VALUES
                ('Tier 1', 'tier1', 10.00, 'Basic tier with 10% discount'),
                ('Tier 2', 'tier2', 15.00, 'Standard tier with 15% discount'),
                ('Tier 3', 'tier3', 20.00, 'Premium tier with 20% discount')
              ON CONFLICT (tier_code) DO NOTHING;
            `);

            await sql.end();

            console.log("✅ Tiers table created successfully");

            // Retry creating the tier
            const { data: newTier, error: retryError } = await supabase
              .from("tiers")
              .insert({
                tier_name: tierName,
                tier_code: tierCode.toLowerCase().replace(/\s+/g, ''),
                discount_percentage: discount,
                description: description || null,
              })
              .select()
              .single();

            if (!retryError) {
              return NextResponse.json({
                success: true,
                tier: newTier,
                message: "Tier created successfully",
              });
            }
          } catch (createError) {
            await sql.end();
            console.error("Failed to create tiers table:", createError);
          }
        } catch (initError) {
          console.error("Failed to initialize tiers table:", initError);
        }
      }

      return NextResponse.json(
        { error: "Failed to create tier" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      tier,
      message: "Tier created successfully",
    });
  } catch (error) {
    console.error("Error creating tier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
