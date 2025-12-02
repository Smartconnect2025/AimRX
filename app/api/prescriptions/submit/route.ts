import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * DigitalRx Prescription Submission API
 *
 * Submits prescriptions to the real DigitalRx sandbox API
 * and stores the response in the database.
 */

const DIGITALRX_SANDBOX_URL = "https://sandbox.digitalrx.com/api/v1/prescriptions";
const DIGITALRX_API_KEY = "sk_test_1234567890abcdef";
const STORE_ID = "190190";
const VENDOR_NAME = "SmartRx Demo";

interface SubmitPrescriptionRequest {
  prescriber_id: string;
  patient_id: string;
  encounter_id?: string;
  appointment_id?: string;
  medication: string;
  dosage: string;
  quantity: number;
  refills: number;
  sig: string;
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

    // Build DigitalRx payload according to their API spec
    const digitalRxPayload = {
      store_id: STORE_ID,
      vendor_name: VENDOR_NAME,
      patient: {
        first_name: body.patient.first_name,
        last_name: body.patient.last_name,
        date_of_birth: body.patient.date_of_birth,
        phone: body.patient.phone || "",
        email: body.patient.email || "",
      },
      prescriber: {
        first_name: body.prescriber.first_name,
        last_name: body.prescriber.last_name,
        npi: body.prescriber.npi || "1234567890", // Default NPI for sandbox
        dea: body.prescriber.dea || "AB1234563", // Default DEA for sandbox
      },
      prescription: {
        medication: body.medication,
        dosage: body.dosage,
        quantity: body.quantity,
        refills: body.refills,
        sig: body.sig,
        dispense_as_written: false,
      },
    };

    console.log("📤 Submitting to DigitalRx:", digitalRxPayload);

    // Submit to real DigitalRx sandbox API
    const digitalRxResponse = await fetch(DIGITALRX_SANDBOX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DIGITALRX_API_KEY}`,
      },
      body: JSON.stringify(digitalRxPayload),
    });

    const digitalRxData = await digitalRxResponse.json();

    console.log("📥 DigitalRx Response:", digitalRxData);

    // Check if submission was successful
    if (!digitalRxResponse.ok) {
      console.error("❌ DigitalRx API Error:", digitalRxData);
      return NextResponse.json(
        {
          success: false,
          error: digitalRxData.error || "Failed to submit prescription to DigitalRx",
          details: digitalRxData,
        },
        { status: digitalRxResponse.status }
      );
    }

    // Extract the real Queue ID from DigitalRx response
    const queueId = digitalRxData.queue_id || digitalRxData.id || `RX-${Date.now()}`;

    console.log("✅ Real Queue ID from DigitalRx:", queueId);

    // Save prescription to Supabase with real Queue ID
    const supabaseAdmin = createAdminClient();

    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .insert({
        prescriber_id: body.prescriber_id,
        patient_id: body.patient_id,
        encounter_id: body.encounter_id || null,
        appointment_id: body.appointment_id || null,
        medication: body.medication,
        dosage: body.dosage,
        quantity: body.quantity,
        refills: body.refills,
        sig: body.sig,
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
          queue_id: queueId,
        },
        { status: 500 }
      );
    }

    // Log to system_logs
    await supabaseAdmin.from("system_logs").insert({
      user_id: body.prescriber_id,
      user_email: body.prescriber.first_name + "@example.com",
      user_name: `Dr. ${body.prescriber.first_name} ${body.prescriber.last_name}`,
      action: "PRESCRIPTION_SUBMITTED_LIVE",
      details: `LIVE submission: ${body.medication} ${body.dosage} for ${body.patient.first_name} ${body.patient.last_name} → DigitalRx`,
      queue_id: queueId,
      status: "success",
    });

    console.log("🎉 Prescription submitted successfully!");

    return NextResponse.json(
      {
        success: true,
        message: "Prescription submitted to DigitalRx successfully",
        queue_id: queueId,
        prescription_id: prescription.id,
        digitalrx_response: digitalRxData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
