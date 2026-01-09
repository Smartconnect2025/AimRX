import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";
import { checkProviderActive } from "@/core/auth/check-provider-active";

/**
 * DigitalRx Prescription Submission API
 *
 * Submits prescriptions to the DigitalRx API and stores the response in the database.
 */

// Use environment variables for DigitalRx API configuration
const DIGITALRX_API_KEY = process.env.DIGITALRX_API_KEY || "12345678901234567890";
const DIGITALRX_BASE_URL = "https://www.dbswebserver.com/DBSRestApi/API";
const DIGITALRX_SUBMIT_URL = `${DIGITALRX_BASE_URL}/RxWebRequest`;
const STORE_ID = "190190"; // Greenwich
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
    // Check if user is authenticated and is a provider
    const { user, userRole } = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if provider is active before allowing prescription submission
    if (userRole === "provider") {
      const isActive = await checkProviderActive(user.id);
      if (!isActive) {
        return NextResponse.json(
          { success: false, error: "Your account is inactive. Please contact administrator to activate your account." },
          { status: 403 }
        );
      }
    }

    const body: SubmitPrescriptionRequest = await request.json();

    // Validate required fields
    if (!body.prescriber_id || !body.patient_id || !body.medication || !body.dosage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if provider exists (optional - just for logging/tracking)
    const supabaseAdmin = createAdminClient();
    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("id, is_active, payment_details, physical_address, billing_address, first_name, last_name")
      .eq("user_id", body.prescriber_id)
      .single();

    // Log if provider not found but don't block prescription submission
    if (providerError || !provider) {
      console.warn("⚠️ Provider profile not found for user:", body.prescriber_id);
      console.warn("⚠️ Continuing with prescription submission anyway...");
    } else {
      // Check if profile is complete (just log warnings, don't block)
      const hasPaymentDetails = provider.payment_details &&
        typeof provider.payment_details === 'object' &&
        Object.keys(provider.payment_details).length > 0;
      const hasPhysicalAddress = provider.physical_address &&
        typeof provider.physical_address === 'object' &&
        Object.keys(provider.physical_address).length > 0;
      const hasBillingAddress = provider.billing_address &&
        typeof provider.billing_address === 'object' &&
        Object.keys(provider.billing_address).length > 0;

      const profileComplete = hasPaymentDetails && hasPhysicalAddress && hasBillingAddress;

      if (!provider.is_active) {
        console.warn("⚠️ Provider is inactive but allowing prescription submission");
      }

      if (!profileComplete) {
        console.warn("⚠️ Provider profile incomplete - missing payment/address details");
      }
    }

    // Generate unique RxNumber for this prescription
    const rxNumber = `RX${Date.now()}`;
    const dateWritten = new Date().toISOString().split('T')[0];

    // Build DigitalRx payload matching their API spec
    const digitalRxPayload = {
      StoreID: STORE_ID,
      VendorName: VENDOR_NAME,
      Patient: {
        FirstName: body.patient.first_name,
        LastName: body.patient.last_name,
        DOB: body.patient.date_of_birth,
        Sex: "M", // Default - would need to be added to form
      },
      Doctor: {
        DoctorFirstName: body.prescriber.first_name,
        DoctorLastName: body.prescriber.last_name,
        DoctorNpi: body.prescriber.npi || "1234567890",
      },
      RxClaim: {
        RxNumber: rxNumber,
        DrugName: body.medication,
        Qty: body.quantity.toString(),
        DateWritten: dateWritten,
      },
    };

    console.log("📤 Submitting to DigitalRx:", digitalRxPayload);

    // Submit to DigitalRx API
    const digitalRxResponse = await fetch(DIGITALRX_SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": DIGITALRX_API_KEY,
      },
      body: JSON.stringify(digitalRxPayload),
    });

    if (!digitalRxResponse.ok) {
      const errorText = await digitalRxResponse.text().catch(() => "Unknown error");
      console.error("❌ DigitalRx API error:", digitalRxResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `DigitalRx API error: ${digitalRxResponse.status} ${digitalRxResponse.statusText}`,
          details: errorText,
        },
        { status: digitalRxResponse.status }
      );
    }

    const digitalRxData = await digitalRxResponse.json();
    console.log("📥 DigitalRx Response:", digitalRxData);

    // Extract Queue ID from DigitalRx response
    const queueId = digitalRxData.QueueID || digitalRxData.queueId || `RX-${Date.now()}`;
    console.log("✅ Queue ID from DigitalRx:", queueId);

    // Save prescription to Supabase with real Queue ID (supabaseAdmin already initialized above)
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
        digitalrx_response: digitalRxData,
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
