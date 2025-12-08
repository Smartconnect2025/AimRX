import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Seed AIM Medical Technologies Pharmacy
 * POST /api/admin/seed-aim
 */
export async function POST() {
  const supabase = createAdminClient();

  console.log("🌱 Seeding AIM Medical Technologies pharmacy...");

  try {
    // Check if AIM pharmacy already exists
    const { data: existingPharmacy } = await supabase
      .from("pharmacies")
      .select("id, name")
      .eq("slug", "aim")
      .single();

    if (existingPharmacy) {
      console.log("✅ AIM pharmacy already exists:", existingPharmacy.name);

      // Check for backend
      const { data: existingBackend } = await supabase
        .from("pharmacy_backends")
        .select("*")
        .eq("pharmacy_id", existingPharmacy.id)
        .single();

      return NextResponse.json({
        success: true,
        message: "AIM pharmacy already seeded",
        pharmacy: existingPharmacy,
        backend: existingBackend,
      });
    }

    // Insert AIM pharmacy
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from("pharmacies")
      .insert({
        name: "AIM Medical Technologies",
        slug: "aim",
        logo_url: null,
        primary_color: "#00AEEF",
        tagline: "Elevating Patient Care with AI-Driven Clinical Innovations",
        address: "123 Innovation Drive, Austin, TX 78701",
        npi: null,
        phone: "(512) 555-2461",
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
        api_key_encrypted: "sk_test_demo_h2h", // Mock key for sandbox
        store_id: "190190",
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
    console.log("🎉 AIM seeded successfully!");

    return NextResponse.json({
      success: true,
      message: "AIM pharmacy seeded successfully",
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
