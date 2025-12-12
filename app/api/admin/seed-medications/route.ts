import { NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * Seed 10 Medications (Stage 2 - Prompt 1/6)
 * POST /api/admin/seed-medications
 */
export async function POST() {
  const supabase = createAdminClient();

  console.log("🌱 Seeding medications for both pharmacies...");

  try {
    // Get pharmacy IDs
    const { data: pharmacies } = await supabase
      .from("pharmacies")
      .select("id, slug")
      .in("slug", ["aim", "grinethch"]);

    const aimPharmacy = pharmacies?.find((p) => p.slug === "aim");
    const grinethchPharmacy = pharmacies?.find((p) => p.slug === "grinethch");

    if (!aimPharmacy || !grinethchPharmacy) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacies not found. Please seed pharmacies first.",
        },
        { status: 400 }
      );
    }

    // AIM Medical Technologies medications
    const aimMedications = [
      {
        pharmacy_id: aimPharmacy.id,
        name: "BPC-157",
        strength: "5mg",
        form: "vial",
        retail_price_cents: 14900,
        doctor_markup_percent: 30,
        is_active: true,
      },
      {
        pharmacy_id: aimPharmacy.id,
        name: "TB-500",
        strength: "5mg",
        form: "vial",
        retail_price_cents: 13900,
        doctor_markup_percent: 30,
        is_active: true,
      },
      {
        pharmacy_id: aimPharmacy.id,
        name: "CJC-1295 + Ipamorelin",
        strength: "10mg",
        form: "vial",
        retail_price_cents: 19900,
        doctor_markup_percent: 30,
        is_active: true,
      },
      {
        pharmacy_id: aimPharmacy.id,
        name: "GHK-Cu",
        strength: "50mg",
        form: "vial",
        retail_price_cents: 8900,
        doctor_markup_percent: 30,
        is_active: true,
      },
      {
        pharmacy_id: aimPharmacy.id,
        name: "Semaglutide",
        strength: "5mg",
        form: "vial",
        retail_price_cents: 27900,
        doctor_markup_percent: 25,
        is_active: true,
      },
    ];

    // Greenwich Pharmacy medications
    const grinethchMedications = [
      {
        pharmacy_id: grinethchPharmacy.id,
        name: "Lisinopril",
        strength: "10mg #90",
        form: "tablet",
        retail_price_cents: 900,
        doctor_markup_percent: 300,
        is_active: true,
      },
      {
        pharmacy_id: grinethchPharmacy.id,
        name: "Atorvastatin",
        strength: "20mg #90",
        form: "tablet",
        retail_price_cents: 1200,
        doctor_markup_percent: 300,
        is_active: true,
      },
      {
        pharmacy_id: grinethchPharmacy.id,
        name: "Metformin",
        strength: "500mg #180",
        form: "tablet",
        retail_price_cents: 800,
        doctor_markup_percent: 300,
        is_active: true,
      },
      {
        pharmacy_id: grinethchPharmacy.id,
        name: "Amlodipine",
        strength: "5mg #90",
        form: "tablet",
        retail_price_cents: 1000,
        doctor_markup_percent: 300,
        is_active: true,
      },
      {
        pharmacy_id: grinethchPharmacy.id,
        name: "Omeprazole",
        strength: "20mg #90",
        form: "capsule",
        retail_price_cents: 1500,
        doctor_markup_percent: 250,
        is_active: true,
      },
    ];

    const allMedications = [...aimMedications, ...grinethchMedications];
    const results = [];

    // Insert or update each medication
    for (const med of allMedications) {
      // Check if medication already exists
      const { data: existing } = await supabase
        .from("pharmacy_medications")
        .select("id")
        .eq("pharmacy_id", med.pharmacy_id)
        .eq("name", med.name)
        .eq("strength", med.strength)
        .single();

      let error;

      if (existing) {
        // Update existing
        const result = await supabase
          .from("pharmacy_medications")
          .update(med)
          .eq("id", existing.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from("pharmacy_medications")
          .insert(med);
        error = result.error;
      }

      if (error) {
        console.error(`Failed to seed ${med.name}:`, error);
        results.push({
          name: med.name,
          status: "failed",
          error: error.message,
        });
      } else {
        results.push({
          name: med.name,
          status: "success",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;

    console.log(`✅ Seeded ${successCount}/${allMedications.length} medications`);

    return NextResponse.json({
      success: successCount === allMedications.length,
      message: `Seeded ${successCount}/${allMedications.length} medications (5 AIM + 5 Greenwich)`,
      results,
    });
  } catch (error) {
    console.error("❌ Medication seeding failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Medication seeding failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
