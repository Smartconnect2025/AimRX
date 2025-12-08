import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Get Provider's Pharmacy with Medications
 * GET /api/provider/pharmacy
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

    // Get provider's pharmacy link (first pharmacy if multiple)
    const { data: link, error: linkError } = await supabase
      .from("provider_pharmacy_links")
      .select("pharmacy_id")
      .eq("provider_id", user.id)
      .limit(1)
      .single();

    if (linkError || !link) {
      // Try pharmacy_admins table (if user is an admin)
      const { data: adminLink, error: adminError } = await supabase
        .from("pharmacy_admins")
        .select("pharmacy_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (adminError || !adminLink) {
        return NextResponse.json(
          {
            success: false,
            error: "No pharmacy linked to this provider/admin",
          },
          { status: 404 }
        );
      }

      // Use admin pharmacy
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from("pharmacies")
        .select("*")
        .eq("id", adminLink.pharmacy_id)
        .single();

      if (pharmacyError || !pharmacy) {
        return NextResponse.json(
          { success: false, error: "Pharmacy not found" },
          { status: 404 }
        );
      }

      // Get medications for this pharmacy
      const { data: medications, error: medsError } = await supabase
        .from("pharmacy_medications")
        .select("*")
        .eq("pharmacy_id", pharmacy.id)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (medsError) {
        console.error("Error fetching medications:", medsError);
      }

      return NextResponse.json({
        success: true,
        pharmacy,
        medications: medications || [],
      });
    }

    // Get pharmacy details
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from("pharmacies")
      .select("*")
      .eq("id", link.pharmacy_id)
      .single();

    if (pharmacyError || !pharmacy) {
      return NextResponse.json(
        { success: false, error: "Pharmacy not found" },
        { status: 404 }
      );
    }

    // Get medications for this pharmacy
    const { data: medications, error: medsError } = await supabase
      .from("pharmacy_medications")
      .select("*")
      .eq("pharmacy_id", pharmacy.id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (medsError) {
      console.error("Error fetching medications:", medsError);
    }

    return NextResponse.json({
      success: true,
      pharmacy,
      medications: medications || [],
    });
  } catch (error) {
    console.error("Error fetching provider pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pharmacy",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
