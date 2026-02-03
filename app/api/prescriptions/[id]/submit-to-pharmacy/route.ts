import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getPrescriptionPdfBase64 } from "@core/services/storage/prescriptionPdfStorage";
import { isEncrypted, decryptApiKey } from "@core/security/encryption";

/**
 * POST /api/prescriptions/[id]/submit-to-pharmacy
 * Submits a paid prescription to the pharmacy (DigitalRx)
 * Called after payment is received
 */

const DEFAULT_DIGITALRX_BASE_URL =
  "https://www.dbswebserver.com/DBSRestApi/API";
const VENDOR_NAME = "SmartRx Demo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: prescriptionId } = await params;

    console.log(
      "📋 [submit-to-pharmacy] Starting for prescription:",
      prescriptionId,
    );

    const supabaseAdmin = createAdminClient();

    // Get prescription details with patient
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .select(
        `
        *,
        patients (*)
      `,
      )
      .eq("id", prescriptionId)
      .single();

    console.log("📋 [submit-to-pharmacy] Query result:", {
      found: !!prescription,
      error: prescriptionError?.message,
      errorCode: prescriptionError?.code,
    });

    if (prescriptionError || !prescription) {
      console.error(
        "❌ Prescription not found:",
        prescriptionId,
        "Error:",
        prescriptionError,
      );
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 },
      );
    }

    // Get provider details separately (prescriber_id references auth.users, not providers)
    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("user_id", prescription.prescriber_id)
      .single();

    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", prescription.patient_id)
      .single();

    if (providerError || !provider) {
      console.error(
        "❌ Provider not found for prescriber_id:",
        prescription.prescriber_id,
        "Error:",
        providerError,
      );
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 },
      );
    }

    // Check if already submitted
    if (prescription.status === "submitted" && prescription.queue_id) {
      console.log("ℹ️ Prescription already submitted to pharmacy");
      return NextResponse.json(
        {
          success: true,
          message: "Prescription already submitted",
          queue_id: prescription.queue_id,
        },
        { status: 200 },
      );
    }

    // Check if payment is completed
    if (prescription.payment_status !== "paid") {
      console.error(
        "❌ Payment not completed for prescription:",
        prescriptionId,
      );
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 },
      );
    }

    // Get pharmacy backend credentials
    const { data: backend } = await supabaseAdmin
      .from("pharmacy_backends")
      .select("api_key_encrypted, api_url, store_id")
      .eq("pharmacy_id", prescription.pharmacy_id)
      .eq("is_active", true)
      .eq("system_type", "DigitalRx")
      .single();

    if (!backend) {
      return NextResponse.json(
        {
          success: false,
          error: "Pharmacy backend not configured",
        },
        { status: 400 },
      );
    }

    // Fix malformed URLs
    if (backend?.api_url) {
      backend.api_url = backend.api_url
        .replace(/^https?\/\/:/, "https://")
        .replace(/^https?:\/\/:/, "https://")
        .replace(/^https?\/\/\/+/, "https://");
    }

    const DIGITALRX_API_KEY = isEncrypted(backend.api_key_encrypted)
      ? decryptApiKey(backend.api_key_encrypted)
      : backend.api_key_encrypted;
    console.log("DIGITALRX_API_KEY", DIGITALRX_API_KEY);
    const DIGITALRX_BASE_URL = backend.api_url || DEFAULT_DIGITALRX_BASE_URL;
    const STORE_ID = backend.store_id;

    // Generate unique RxNumber
    const rxNumber = `RX${Date.now()}`;
    const dateWritten = new Date().toISOString().split("T")[0];

    // Build DigitalRx payload
    const digitalRxPayload = {
      StoreID: STORE_ID,
      VendorName: VENDOR_NAME,
      Patient: {
        FirstName: prescription.patients.first_name,
        LastName: prescription.patients.last_name,
        DOB: prescription.patients.date_of_birth,
        Sex: prescription.patients.gender === "male" ? "M" : "F",
        PatientStreet: patient.physical_address?.street,
        PatientCity: patient.physical_address?.city,
        PatientState: patient.physical_address?.state,
        PatientZip:
          patient.physical_address?.zipCode || patient.physical_address?.zip,
        PatientPhone: patient.phone,
      },
      Doctor: {
        DoctorFirstName: provider.first_name,
        DoctorLastName: provider.last_name,
        DoctorNpi: provider.npi_number || "1234567890",
        DoctorStreet: provider.physical_address?.street,
        DoctorCity: provider.physical_address?.city,
        DoctorState: provider.physical_address?.state,
        DoctorZip:
          provider.physical_address?.zipCode || provider.physical_address?.zip,
        DoctorPhone: provider.phone,
      },
      RxClaim: {
        RxNumber: rxNumber,
        DrugName: prescription.medication,
        Qty: prescription.quantity.toString(),
        DateWritten: dateWritten,
        RequestedBy: provider.first_name + " " + provider.last_name,

        // to do
        /*   DrugNDC: "00093-0012-01",
        Refills: "1",
        Instructions: "Take 1 capsule by mouth daily",
        Daw: "N",
        DaysSupply: "30",
        Notes: "Fill as is", */
      },

      DocSignature: provider.signature_url,
      PDFFile: prescription.pdf_storage_path
        ? (
            await getPrescriptionPdfBase64(
              supabaseAdmin,
              prescription.pdf_storage_path,
            )
          ).base64 || null
        : null,
    };

    console.log(
      "📤 Submitting paid prescription to DigitalRx:",
      digitalRxPayload,
    );

    // Submit to DigitalRx API
    const digitalRxResponse = await fetch(
      `${DIGITALRX_BASE_URL}/RxWebRequest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: DIGITALRX_API_KEY,
        },
        body: JSON.stringify(digitalRxPayload),
      },
    );

    if (!digitalRxResponse.ok) {
      const errorText = await digitalRxResponse
        .text()
        .catch(() => "Unknown error");
      console.error(
        "❌ DigitalRx API error:",
        digitalRxResponse.status,
        errorText,
      );
      return NextResponse.json(
        {
          success: false,
          error: `DigitalRx API error: ${digitalRxResponse.status}`,
          details: errorText,
        },
        { status: digitalRxResponse.status },
      );
    }

    const digitalRxData = await digitalRxResponse.json();

    // Extract Queue ID
    const queueId =
      digitalRxData.QueueID || digitalRxData.queueId || digitalRxData.ID;
    if (!queueId) {
      console.error("❌ DigitalRx did not return a QueueID:", digitalRxData);
      return NextResponse.json(
        {
          success: false,
          error: "DigitalRx did not return a QueueID",
          details: digitalRxData,
        },
        { status: 500 },
      );
    }

    console.log("✅ Queue ID from DigitalRx:", queueId);

    // Update prescription with pharmacy-specific fields only
    // Note: payment_status and order_progress are already set by the webhook
    const { error: updateError } = await supabaseAdmin
      .from("prescriptions")
      .update({
        queue_id: queueId,
        status: "submitted",
        order_progress: "pharmacy_processing", // Advance to next stage
        submitted_to_pharmacy_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId);

    if (updateError) {
      console.error("❌ Error updating prescription:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update prescription",
        },
        { status: 500 },
      );
    }

    // Log to system_logs
    await supabaseAdmin.from("system_logs").insert({
      user_id: prescription.prescriber_id,
      user_email: provider.email || "unknown@example.com",
      user_name: `Dr. ${provider.first_name} ${provider.last_name}`,
      action: "PRESCRIPTION_SUBMITTED_AFTER_PAYMENT",
      details: `DigitalRx: ${prescription.medication} for ${prescription.patients.first_name} ${prescription.patients.last_name}`,
      queue_id: queueId,
      status: "success",
    });

    console.log("✅ Prescription submitted to pharmacy after payment");

    return NextResponse.json(
      {
        success: true,
        message: "Prescription submitted to pharmacy successfully",
        queue_id: queueId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Error submitting prescription to pharmacy:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
