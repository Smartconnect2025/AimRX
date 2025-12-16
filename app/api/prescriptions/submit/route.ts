import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * DigitalRx Prescription Submission API
 *
 * Submits prescriptions to the DigitalRx API and stores the response in the database.
 */

// Use environment variables for DigitalRx API configuration
const H2H_DIGITALRX_API_KEY = process.env.DIGITALRX_API_KEY || "sk_test_demo_h2h";
const H2H_DIGITALRX_BASE_URL = process.env.DIGITALRX_API_URL || "https://sandbox.h2hdigitalrx.com";
const H2H_DIGITALRX_SANDBOX_URL = `https://${H2H_DIGITALRX_BASE_URL}/api/v1/prescriptions`;
const STORE_ID = "190190";
const VENDOR_NAME = "SmartRx Demo";

interface SubmitPrescriptionRequest {
  prescriber_id: string;
  patient_id: string;
  encounter_id?: string;
  appointment_id?: string;
  medication: string;
  dosage: string; // Legacy field: combined amount+unit (e.g., "10mg")
  dosage_amount?: string; // New structured field: numeric amount (e.g., "10")
  dosage_unit?: string; // New structured field: unit (e.g., "mg")
  vial_size?: string;
  form?: string;
  quantity: number;
  refills: number;
  sig: string;
  dispense_as_written?: boolean;
  pharmacy_notes?: string;
  patient_price?: string;
  doctor_price?: string;
  patient: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone?: string;
    email?: string;
  };
  prescriber: {
    first_name: string;
    last_name: string;
    npi?: string;
    dea?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitPrescriptionRequest = await request.json();

    // Validate required fields
    if (!body.prescriber_id || !body.patient_id || !body.medication || !body.dosage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build DigitalRx payload (Surescripts-compliant format)
    const h2hPayload = {
      store_id: STORE_ID,
      vendor_name: VENDOR_NAME,
      submission_type: "NewRx",
      patient: {
        first_name: body.patient.first_name,
        last_name: body.patient.last_name,
        date_of_birth: body.patient.date_of_birth,
        phone: body.patient.phone || "",
        email: body.patient.email || "",
        address: {
          street: "123 Main St",
          city: "Detroit",
          state: "MI",
          zip: "48201",
        },
      },
      prescriber: {
        first_name: body.prescriber.first_name,
        last_name: body.prescriber.last_name,
        npi: body.prescriber.npi || "1234567890",
        dea: body.prescriber.dea || "AB1234563",
        phone: "248-896-9190",
      },
      medication: {
        name: body.medication,
        strength: body.dosage,
        dosage_form: "Tablet",
        quantity: body.quantity,
        refills: body.refills,
        days_supply: 30,
        sig: body.sig,
        dispense_as_written: false,
      },
    };

    console.log("📤 Submitting to DigitalRx:", h2hPayload);

    // Submit to DigitalRx API
    const h2hResponse = await fetch(H2H_DIGITALRX_SANDBOX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${H2H_DIGITALRX_API_KEY}`,
      },
      body: JSON.stringify(h2hPayload),
    });

    if (!h2hResponse.ok) {
      const errorText = await h2hResponse.text().catch(() => "Unknown error");
      console.error("❌ DigitalRx API error:", h2hResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `DigitalRx API error: ${h2hResponse.status} ${h2hResponse.statusText}`,
          details: errorText,
        },
        { status: h2hResponse.status }
      );
    }

    const h2hData = await h2hResponse.json();
    console.log("📥 DigitalRx Response:", h2hData);

    // Extract Queue ID from DigitalRx response
    const queueId = h2hData.queue_id || h2hData.id || h2hData.transaction_id || `RX-${Date.now()}`;
    console.log("✅ Queue ID from DigitalRx:", queueId);

    // Save prescription to Supabase with real Queue ID
    const supabaseAdmin = createAdminClient();

    console.log("💾 Saving with prescriber_id:", body.prescriber_id);

    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .insert({
        prescriber_id: body.prescriber_id,
        patient_id: body.patient_id,
        encounter_id: body.encounter_id || null,
        appointment_id: body.appointment_id || null,
        medication: body.medication,
        dosage: body.dosage,
        dosage_amount: body.dosage_amount || null,
        dosage_unit: body.dosage_unit || null,
        vial_size: body.vial_size || null,
        form: body.form || null,
        quantity: body.quantity,
        refills: body.refills,
        sig: body.sig,
        dispense_as_written: body.dispense_as_written || false,
        pharmacy_notes: body.pharmacy_notes || null,
        patient_price: body.patient_price || null,
        doctor_price: body.doctor_price || null,
        queue_id: queueId,
        status: "submitted",
      })
      .select()
      .single();

    if (prescriptionError) {
      console.error("❌ Error saving to database:", prescriptionError);
      return NextResponse.json(
        {
          success: false,
          error: "Prescription submitted to DigitalRx but failed to save locally",
          error_details: prescriptionError,
          queue_id: queueId,
        },
        { status: 500 }
      );
    }

    console.log("✅ Prescription saved to database successfully:", prescription);

    // Log to system_logs
    await supabaseAdmin.from("system_logs").insert({
      user_id: body.prescriber_id,
      user_email: body.prescriber.first_name + "@example.com",
      user_name: `Dr. ${body.prescriber.first_name} ${body.prescriber.last_name}`,
      action: "PRESCRIPTION_SUBMITTED",
      details: `DigitalRx: ${body.medication} ${body.dosage} for ${body.patient.first_name} ${body.patient.last_name}`,
      queue_id: queueId,
      status: "success",
    });

    console.log("✅ Prescription submitted successfully to DigitalRx");

    return NextResponse.json(
      {
        success: true,
        message: "Prescription submitted to DigitalRx successfully",
        queue_id: queueId,
        prescription_id: prescription.id,
        digitalrx_response: h2hData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error details:", errorMessage);

    // Return detailed error for debugging
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        error_details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
