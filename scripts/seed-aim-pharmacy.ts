import { createAdminClient } from "@/core/database/client";

/**
 * Seed AIM Medical Technologies Pharmacy
 * Stage 1 - Multi-pharmacy upgrade
 */
async function seedAIMPharmacy() {
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
      console.log("   Pharmacy ID:", existingPharmacy.id);

      // Check for backend
      const { data: existingBackend } = await supabase
        .from("pharmacy_backends")
        .select("*")
        .eq("pharmacy_id", existingPharmacy.id)
        .single();

      if (existingBackend) {
        console.log("✅ DigitalRx backend already configured");
      }

      return;
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
      throw pharmacyError;
    }

    console.log("✅ Created pharmacy:", pharmacy.name);
    console.log("   Pharmacy ID:", pharmacy.id);

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
      throw backendError;
    }

    console.log("✅ Created DigitalRx backend");
    console.log("   Backend ID:", backend.id);
    console.log("   System Type:", backend.system_type);

    console.log("\n🎉 AIM seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run the seed function
seedAIMPharmacy()
  .then(() => {
    console.log("\n✅ Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  });
