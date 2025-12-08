import { NextResponse } from "next/server";
import { createServerClient } from "@core/supabase/server";

/**
 * Seed 20 Real High-Profit Medications
 * DELETE old test meds and INSERT real profit-driven catalog
 */
export async function POST() {
  const supabase = await createServerClient();

  try {
    // Get AIM pharmacy ID
    const { data: aimPharmacy, error: pharmacyError } = await supabase
      .from("pharmacies")
      .select("id")
      .eq("slug", "aim")
      .single();

    if (pharmacyError || !aimPharmacy) {
      return NextResponse.json(
        { error: "AIM pharmacy not found" },
        { status: 404 }
      );
    }

    const pharmacyId = aimPharmacy.id;

    // 1. DELETE ALL OLD MEDICATIONS
    const { error: deleteError } = await supabase
      .from("pharmacy_medications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) {
      console.error("Error deleting old medications:", deleteError);
    }

    // 2. SEED 20 REAL HIGH-PROFIT MEDICATIONS
    const realMedications = [
      {
        pharmacy_id: pharmacyId,
        name: "Tirzepatide 30mg + B12",
        strength: "2mL",
        form: "Injection",
        dosage_instructions: "Inject 50 units weekly",
        retail_price_cents: 16000, // $160
        doctor_markup_percent: 100, // 100% markup = $320 doctor price
        category: "Weight Loss (GLP-1)",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Retatrutide 24mg + B12",
        strength: "2mL",
        form: "Injection",
        dosage_instructions: "Inject 50 units weekly",
        retail_price_cents: 36000, // $360
        doctor_markup_percent: 100,
        category: "Weight Loss (GLP-1)",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Tirzepatide 25mg + B12",
        strength: "2mL",
        form: "Injection",
        dosage_instructions: "Inject 50 units weekly",
        retail_price_cents: 14000, // $140
        doctor_markup_percent: 100,
        category: "Weight Loss (GLP-1)",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Semaglutide 10mg + B12",
        strength: "1mL",
        form: "Injection",
        dosage_instructions: "Inject 25 units weekly",
        retail_price_cents: 7000, // $70
        doctor_markup_percent: 100,
        category: "Weight Loss (GLP-1)",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "BPC-157 5mg",
        strength: "5mL",
        form: "Injection",
        dosage_instructions: "Inject 20 units daily",
        retail_price_cents: 6500, // $65
        doctor_markup_percent: 100,
        category: "Peptides & Growth Hormone",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "TB-500 5mg",
        strength: "5mg vial",
        form: "Injection",
        dosage_instructions: "2.5mg twice weekly",
        retail_price_cents: 9000, // $90
        doctor_markup_percent: 100,
        category: "Peptides & Growth Hormone",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "CJC-1295 + Ipamorelin 10mg",
        strength: "5mL",
        form: "Injection",
        dosage_instructions: "Inject 20 units nightly M-F",
        retail_price_cents: 9900, // $99
        doctor_markup_percent: 100,
        category: "Peptides & Growth Hormone",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "GHK-Cu 50mg",
        strength: "50mg vial",
        form: "Injection",
        dosage_instructions: "Topical or inject",
        retail_price_cents: 8900, // $89
        doctor_markup_percent: 100,
        category: "Peptides & Growth Hormone",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "PT-141 10mg",
        strength: "10mg vial",
        form: "Injection",
        dosage_instructions: "0.5–1mg before activity",
        retail_price_cents: 10000, // $100
        doctor_markup_percent: 100,
        category: "Sexual Health",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "NAD+ 500mg",
        strength: "500mg vial",
        form: "Injection",
        dosage_instructions: "100mg weekly",
        retail_price_cents: 10000, // $100
        doctor_markup_percent: 100,
        category: "Anti-Aging / NAD+",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Sema Starter Bundle",
        strength: "1mg/2mg/4mg",
        form: "Bundle",
        dosage_instructions: "Start with 1mg, titrate up",
        retail_price_cents: 7000, // $70
        doctor_markup_percent: 100,
        category: "Bundles",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Tirz Starter Bundle",
        strength: "10mg/15mg/20mg",
        form: "Bundle",
        dosage_instructions: "Start with 10mg, titrate up",
        retail_price_cents: 16000, // $160
        doctor_markup_percent: 100,
        category: "Bundles",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "AOD-9604 6mg",
        strength: "5mL",
        form: "Injection",
        dosage_instructions: "20 units M-F",
        retail_price_cents: 6500, // $65
        doctor_markup_percent: 100,
        category: "Weight Loss (GLP-1)",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "MOTS-c 10mg",
        strength: "5mL",
        form: "Injection",
        dosage_instructions: "10 units daily",
        retail_price_cents: 12000, // $120
        doctor_markup_percent: 100,
        category: "Weight Loss (GLP-1)",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Epitalon 10mg",
        strength: "10mg vial",
        form: "Injection",
        dosage_instructions: "5mg twice monthly",
        retail_price_cents: 8000, // $80
        doctor_markup_percent: 100,
        category: "Anti-Aging / NAD+",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "DSIP 5mg",
        strength: "5mg vial",
        form: "Injection",
        dosage_instructions: "20 units nightly",
        retail_price_cents: 8500, // $85
        doctor_markup_percent: 100,
        category: "Sleep & Recovery",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Tadalafil 5mg troche x30",
        strength: "5mg x30",
        form: "Troche",
        dosage_instructions: "One daily or as needed",
        retail_price_cents: 6000, // $60
        doctor_markup_percent: 100,
        category: "Sexual Health",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Sildenafil 100mg troche x30",
        strength: "100mg x30",
        form: "Troche",
        dosage_instructions: "One as needed",
        retail_price_cents: 6000, // $60
        doctor_markup_percent: 100,
        category: "Sexual Health",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "L-Carnitine 500mg/mL",
        strength: "10mL",
        form: "Injection",
        dosage_instructions: "1mL daily",
        retail_price_cents: 5000, // $50
        doctor_markup_percent: 100,
        category: "Weight Loss (GLP-1)",
        image_url: null,
        is_active: true,
      },
      {
        pharmacy_id: pharmacyId,
        name: "Thymosin Alpha-1 10mg",
        strength: "10mg vial",
        form: "Injection",
        dosage_instructions: "Immune support",
        retail_price_cents: 11000, // $110
        doctor_markup_percent: 100,
        category: "Immune Health",
        image_url: null,
        is_active: true,
      },
    ];

    // Insert all medications
    const { data: insertedMeds, error: insertError } = await supabase
      .from("pharmacy_medications")
      .insert(realMedications)
      .select();

    if (insertError) {
      console.error("Error inserting medications:", insertError);
      return NextResponse.json(
        { error: "Failed to seed medications", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully seeded 20 real high-profit medications",
      medications: insertedMeds,
      count: insertedMeds?.length || 0,
    });
  } catch (error) {
    console.error("Error in seed-real-medications:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
