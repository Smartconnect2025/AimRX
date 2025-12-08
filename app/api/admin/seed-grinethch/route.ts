import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Seed Grinethch Pharmacy
 * POST /api/admin/seed-grinethch
 */
export async function POST() {
  const supabase = createAdminClient();

  console.log("🌱 Seeding Grinethch Pharmacy...");

  try {
    // Check if Grinethch pharmacy already exists
    const { data: existingPharmacy } = await supabase
      .from("pharmacies")
      .select("id, name")
      .eq("slug", "grinethch")
      .single();

    if (existingPharmacy) {
      console.log("✅ Grinethch pharmacy already exists:", existingPharmacy.name);

      // Check for backend
      const { data: existingBackend } = await supabase
        .from("pharmacy_backends")
        .select("*")
        .eq("pharmacy_id", existingPharmacy.id)
        .single();

      return NextResponse.json({
        success: true,
        message: "Grinethch pharmacy already seeded",
        pharmacy: existingPharmacy,
        backend: existingBackend,
      });
    }

    // Insert Grinethch pharmacy
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from("pharmacies")
      .insert({
        name: "Grinethch Pharmacy",
        slug: "grinethch",
        logo_url: null,
        primary_color: "#228B22",
        tagline: "Your Local Compounding Experts",
        address: "456 Green Street, Dallas, TX 75201",
        npi: null,
        phone: "(214) 555-7890",
        is_active: true,
      })
      .select()
      .single();

    if (pharmacyError) {
      console.error("❌ Error creating pharmacy:", pharmacyError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create pharmacy",
          details: pharmacyError,
        },
        { status: 500 }
      );
    }

    console.log("✅ Created pharmacy:", pharmacy.name);

    // Insert DigitalRx backend
    const { data: backend, error: backendError } = await supabase
      .from("pharmacy_backends")
      .insert({
        pharmacy_id: pharmacy.id,
        system_type: "DigitalRx",
        api_url: "https://sandbox.h2hdigitalrx.com/api/v1/prescriptions",
        api_key_encrypted: "sk_test_demo_grinethch", // Mock key for sandbox
        store_id: "190191",
        location_id: null,
        is_active: true,
      })
      .select()
      .single();

    if (backendError) {
      console.error("❌ Error creating backend:", backendError);
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacy created but backend setup failed",
          pharmacy,
          details: backendError,
        },
        { status: 500 }
      );
    }

    console.log("✅ Created DigitalRx backend");
    console.log("🎉 Grinethch seeded successfully!");

    return NextResponse.json({
      success: true,
      message: "Grinethch pharmacy seeded successfully",
      pharmacy,
      backend,
    });
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Seeding failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
