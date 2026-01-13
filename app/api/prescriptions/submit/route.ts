import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";
import { checkProviderActive } from "@/core/auth/check-provider-active";

/**
 * DigitalRx Prescription Submission API
 *
 * Submits prescriptions to the DigitalRx API and stores the response in the database.
 * Uses pharmacy-specific credentials from pharmacy_backends table.
 */

// Fallback base URL if not configured in pharmacy_backends
const DEFAULT_DIGITALRX_BASE_URL = "https://www.dbswebserver.com/DBSRestApi/API";
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
  pharmacy_id?: string;
  medication_id?: string;
  profit_cents?: number; // Provider oversight/monitoring fees in cents
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

    // Require pharmacy_id
    if (!body.pharmacy_id) {
      return NextResponse.json(
        { success: false, error: "pharmacy_id is required" },
        { status: 400 }
      );
    }

    // Get pharmacy backend credentials
    const { data: backend } = await supabaseAdmin
      .from("pharmacy_backends")
      .select("api_key_encrypted, api_url, store_id")
      .eq("pharmacy_id", body.pharmacy_id)
      .eq("is_active", true)
      .eq("system_type", "DigitalRx")
      .single();

    // Validate and fix pharmacy backend URL
    if (backend?.api_url) {
      // Fix malformed URLs (https//: or https//: -> https://)
      // Handle cases like: https//:example.com, http//:example.com, https://:example.com
      backend.api_url = backend.api_url
        .replace(/^https?\/\/:/, 'https://')    // https//: -> https://
        .replace(/^https?:\/\/:/, 'https://')   // https://: -> https://
        .replace(/^https?\/\/\/+/, 'https://'); // https:/// -> https://

      // Validate URL format
      try {
        new URL(backend.api_url);
      } catch {
        console.error("Invalid pharmacy API URL:", backend.api_url);
        return NextResponse.json(
          {
            success: false,
            error: "Pharmacy API URL is invalid. Please contact administrator.",
          },
          { status: 500 }
        );
      }
    }

    if (!backend) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected pharmacy does not have DigitalRx configured.",
        },
        { status: 400 }
      );
    }

    const DIGITALRX_API_KEY = backend.api_key_encrypted;
    const DIGITALRX_BASE_URL = backend.api_url || DEFAULT_DIGITALRX_BASE_URL;
    const STORE_ID = backend.store_id;

    console.log(`📍 Using pharmacy backend: Store ${STORE_ID}`);

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
    console.log("📍 Pharmacy Backend URL:", DIGITALRX_BASE_URL);

    // Submit to DigitalRx API
    let digitalRxResponse;
    try {
      digitalRxResponse = await fetch(`${DIGITALRX_BASE_URL}/RxWebRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": DIGITALRX_API_KEY,
        },
        body: JSON.stringify(digitalRxPayload),
      });
    } catch (fetchError) {
      console.error("❌ Failed to connect to pharmacy backend:", fetchError);
      console.error("❌ Backend URL was:", DIGITALRX_BASE_URL);
      return NextResponse.json(
        {
          success: false,
          error: "Unable to connect to pharmacy backend. Please check pharmacy configuration.",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 503 }
      );
    }

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

    // Check for error in response body (DigitalRx returns 200 OK with error in body)
    if (digitalRxData.Error) {
      // Check if it's just the invoice number validation warning (non-fatal)
      const isInvoiceWarning = typeof digitalRxData.Error === 'string' &&
        digitalRxData.Error.includes('invoiceNumber') &&
        digitalRxData.Error.includes('MaxLength');

      // If it's not the invoice warning, or if there's no QueueID, treat as fatal error
      const hasQueueId = digitalRxData.QueueID || digitalRxData.queueId || digitalRxData.ID;

      if (!isInvoiceWarning && !hasQueueId) {
        console.error("❌ Fatal DigitalRx error:", digitalRxData.Error);
        return NextResponse.json(
          {
            success: false,
            error: `DigitalRx error: ${digitalRxData.Error}`,
            details: digitalRxData,
          },
          { status: 400 }
        );
      }

      // Silently ignore invoice warning if we have a QueueID - it's non-fatal
      if (isInvoiceWarning && hasQueueId) {
        // Don't log anything - user doesn't need to see this warning
      }
    }

    // Extract Queue ID from DigitalRx response
    const queueId = digitalRxData.QueueID || digitalRxData.queueId || digitalRxData.ID
    if (!queueId) {
      console.error("❌ DigitalRx did not return a QueueID:", digitalRxData);
      return NextResponse.json(
        {
          success: false,
          error: "DigitalRx did not return a QueueID",
          details: digitalRxData,
        },
        { status: 500 }
      );
    }
    console.log("✅ Queue ID from DigitalRx:", queueId);

    // Save prescription to Supabase with real Queue ID (supabaseAdmin already initialized above)
    console.log("💾 Saving with prescriber_id:", body.prescriber_id);
    console.log("💰 Received profit_cents from frontend:", body.profit_cents);
    console.log("💰 Received patient_price from frontend:", body.patient_price);

    // Convert patient_price from dollars to cents for total_paid_cents
    const totalPaidCents = body.patient_price
      ? Math.round(parseFloat(body.patient_price) * 100)
      : 0;

    console.log("💰 Calculated total_paid_cents:", totalPaidCents);

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
        pharmacy_id: body.pharmacy_id || null,
        medication_id: body.medication_id || null,
        profit_cents: body.profit_cents || 0, // Provider oversight/monitoring fees
        total_paid_cents: totalPaidCents, // Medication price in cents
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
