import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Create a new medication for the pharmacy admin's pharmacy
 * POST /api/admin/medications
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

    // Get pharmacy admin's pharmacy
    const { data: adminLink } = await supabase
      .from("pharmacy_admins")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .single();

    if (!adminLink) {
      return NextResponse.json(
        { success: false, error: "You are not linked to any pharmacy" },
        { status: 403 }
      );
    }

    const pharmacyId = adminLink.pharmacy_id;

    // Parse request body
    const body = await request.json();
    const {
      name,
      strength,
      form,
      ndc,
      retail_price_cents,
      doctor_markup_percent,
      category,
      dosage_instructions,
      image_url,
    } = body;

    // Validate required fields
    if (!name || !retail_price_cents) {
      return NextResponse.json(
        { success: false, error: "Medication name and retail price are required" },
        { status: 400 }
      );
    }

    // Create medication
    const { data: medication, error: insertError } = await supabase
      .from("pharmacy_medications")
      .insert({
        pharmacy_id: pharmacyId,
        name,
        strength: strength || null,
        form: form || null,
        ndc: ndc || null,
        retail_price_cents: parseInt(retail_price_cents),
        doctor_markup_percent: parseInt(doctor_markup_percent) || 25,
        category: category || null,
        dosage_instructions: dosage_instructions || null,
        image_url: image_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating medication:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create medication",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Medication "${name}" created successfully`,
      medication,
    });
  } catch (error) {
    console.error("Error in create medication:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create medication",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get all medications for the pharmacy admin's pharmacy
 * GET /api/admin/medications
 */
export async function GET() {
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

    // Get pharmacy admin's pharmacy
    const { data: adminLink } = await supabase
      .from("pharmacy_admins")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .single();

    if (!adminLink) {
      return NextResponse.json(
        { success: false, error: "You are not linked to any pharmacy" },
        { status: 403 }
      );
    }

    const pharmacyId = adminLink.pharmacy_id;

    // Get all medications for this pharmacy
    const { data: medications, error } = await supabase
      .from("pharmacy_medications")
      .select("*")
      .eq("pharmacy_id", pharmacyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching medications:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch medications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      medications,
    });
  } catch (error) {
    console.error("Error in get medications:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch medications",
      },
      { status: 500 }
    );
  }
}
