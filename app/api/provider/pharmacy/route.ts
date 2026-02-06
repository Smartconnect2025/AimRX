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
          }
        }
      }

      // If still no pharmacy link, user is a regular doctor (no pharmacy affiliation)
      // This is OK - they will see the global catalog
    }

    // Get pharmacy details if pharmacyId exists
    let pharmacy = null;
    if (pharmacyId) {
      const { data: pharmacyData, error: pharmacyError } = await supabase
        .from("pharmacies")
        .select("*")
        .eq("id", pharmacyId)
        .single();

      if (pharmacyError) {
        console.error("Error fetching pharmacy:", pharmacyError);
      } else {
        pharmacy = pharmacyData;
      }
    }

    // Check user role to determine medication filtering
    // Pharmacy admins: Show ONLY their pharmacy's medications
    // Regular doctors/providers: Show ALL medications from ALL pharmacies (global profit catalog)

    // Check if user is in pharmacy_admins table
    const { data: pharmacyAdminLink } = await supabase
      .from("pharmacy_admins")
      .select("pharmacy_id")
      .eq("user_id", user.id)
      .single();

    // User is a pharmacy admin ONLY if they have an entry in pharmacy_admins table
    // Note: Super admins (role="admin" in user_roles) are NOT pharmacy admins
    const isPharmacyAdmin = !!pharmacyAdminLink;

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
      .eq("is_active", true)
      .eq("pharmacy.is_active", true);

    // Filter by pharmacy for admins only (if they have a pharmacy link)
    if (isPharmacyAdmin && pharmacyId) {
      medicationsQuery = medicationsQuery.eq("pharmacy_id", pharmacyId);
    }

    const { data: allMedications, error: medsError } = await medicationsQuery.order("name", { ascending: true });

    if (medsError) {
      console.error("Error fetching medications:", medsError);
    }

    // Transform to include profit calculations
    // Use notes field for aimrx_site_pricing (displayed as "Price of Medication" to providers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const medicationsWithProfit = (allMedications || []).map((med: any) => {
      // Parse aimrx_site_pricing from notes field (stored as cents string)
      const aimrxSitePricingCents = med.notes ? parseInt(med.notes) : med.retail_price_cents;
      const retailPrice = aimrxSitePricingCents / 100; // This is the "Price of Medication" shown to providers
      const doctorPrice = retailPrice * (1 + med.doctor_markup_percent / 100);
      const profit = doctorPrice - retailPrice;

      return {
        ...med,
        retail_price: retailPrice, // Actually aimrx_site_pricing, displayed as "Price of Medication"
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
