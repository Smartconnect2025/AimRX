import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Create a new pharmacy
 * POST /api/admin/pharmacies
 */
export async function POST(request: Request) {
  const supabase = await createServerClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, slug, logo_url, primary_color, tagline, address, npi, phone } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Create pharmacy
    const { data: pharmacy, error: insertError } = await supabase
      .from("pharmacies")
      .insert({
        name,
        slug: slug.toLowerCase().trim(),
        logo_url: logo_url || null,
        primary_color: primary_color || "#00AEEF",
        tagline: tagline || null,
        address: address || null,
        npi: npi || null,
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating pharmacy:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create pharmacy",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Pharmacy "${name}" created successfully`,
      pharmacy,
    });
  } catch (error) {
    console.error("Error in create pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create pharmacy",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get all pharmacies
 * GET /api/admin/pharmacies
 */
export async function GET() {
  const supabase = await createServerClient();

  try {
    const { data: pharmacies, error } = await supabase
      .from("pharmacies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pharmacies:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch pharmacies" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pharmacies,
    });
  } catch (error) {
    console.error("Error in get pharmacies:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pharmacies",
      },
      { status: 500 }
    );
  }
}
