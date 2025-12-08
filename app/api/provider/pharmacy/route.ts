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
    const { data: link } = await supabase
      .from("provider_pharmacy_links")
      .select("pharmacy_id")
      .eq("provider_id", user.id)
      .limit(1)
      .single();

    let pharmacyId: string | null = link?.pharmacy_id || null;

    if (!pharmacyId) {
      // Try pharmacy_admins table (if user is an admin)
      const { data: adminLink } = await supabase
        .from("pharmacy_admins")
        .select("pharmacy_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      pharmacyId = adminLink?.pharmacy_id || null;

      // FALLBACK: Auto-link based on email domain
      if (!pharmacyId && user.email) {
        console.log("⚠️ No pharmacy link found, attempting auto-link for:", user.email);

        let pharmacySlug: string | null = null;

        if (user.email.includes("@aimmedtech.com")) {
          pharmacySlug = "aim";
        } else if (user.email.includes("@grinethch.com")) {
          pharmacySlug = "grinethch";
        }

        if (pharmacySlug) {
          // Find pharmacy by slug
          const { data: foundPharmacy } = await supabase
            .from("pharmacies")
            .select("id")
            .eq("slug", pharmacySlug)
            .single();

          if (foundPharmacy) {
            // Create pharmacy_admins link
            await supabase
              .from("pharmacy_admins")
              .insert({
                user_id: user.id,
                pharmacy_id: foundPharmacy.id,
              });

            pharmacyId = foundPharmacy.id;
            console.log(`✅ Auto-linked ${user.email} to ${pharmacySlug} pharmacy`);
          }
        }
      }

      if (!pharmacyId) {
        return NextResponse.json(
          {
            success: false,
            error: "No pharmacy linked to this provider/admin",
          },
          { status: 404 }
        );
      }
    }

    // Get pharmacy details using the resolved pharmacyId
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from("pharmacies")
      .select("*")
      .eq("id", pharmacyId)
      .single();

    if (pharmacyError || !pharmacy) {
      return NextResponse.json(
        { success: false, error: "Pharmacy not found" },
        { status: 404 }
      );
    }

    // Check user role to determine medication filtering
    // Pharmacy admins: Show ONLY their pharmacy's medications
    // Regular doctors/providers: Show ALL medications from ALL pharmacies (global profit catalog)
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Also check if user is in pharmacy_admins table
    const { data: pharmacyAdminLink } = await supabase
      .from("pharmacy_admins")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .single();

    // User is a pharmacy admin if:
    // 1. They have role="admin" in user_roles, OR
    // 2. They have an entry in pharmacy_admins table
    const isPharmacyAdmin = userRole?.role === "admin" || !!pharmacyAdminLink;

    // If pharmacy admin: show ONLY their pharmacy's medications
    // If regular doctor: show ALL medications from ALL pharmacies (global profit catalog)
    let medicationsQuery = supabase
      .from("pharmacy_medications")
      .select(`
        *,
        pharmacy:pharmacies!inner(
          id,
          name,
          slug,
          primary_color,
          tagline
        )
      `)
      .eq("is_active", true);

    // Filter by pharmacy for admins only
    if (isPharmacyAdmin) {
      medicationsQuery = medicationsQuery.eq("pharmacy_id", pharmacyId);
    }

    const { data: allMedications, error: medsError } = await medicationsQuery.order("name", { ascending: true });

    if (medsError) {
      console.error("Error fetching medications:", medsError);
    }

    // Transform to include profit calculations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const medicationsWithProfit = (allMedications || []).map((med: any) => {
      const retailPrice = med.retail_price_cents / 100;
      const doctorPrice = retailPrice * (1 + med.doctor_markup_percent / 100);
      const profit = doctorPrice - retailPrice;

      return {
        ...med,
        retail_price: retailPrice,
        doctor_price: doctorPrice,
        profit: profit,
        pharmacy: med.pharmacy,
      };
    });

    return NextResponse.json({
      success: true,
      pharmacy, // User's primary pharmacy (for context/header)
      medications: medicationsWithProfit,
      isPharmacyAdmin, // Pass role info to frontend
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
