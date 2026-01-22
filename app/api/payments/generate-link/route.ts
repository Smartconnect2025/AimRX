import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";
import { envConfig } from "@/core/config/envConfig";
import crypto from "crypto";

// Internal API key for server-to-server email calls
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

/**
 * POST /api/payments/generate-link
 * Generate a payment link for a prescription
 * This creates a unique token and payment URL that can be sent to the patient
 */
export async function POST(request: NextRequest) {
  console.log("[GENERATE-LINK] Started");

  try {
    const { user, userRole } = await getUser();

    if (!user || userRole !== "provider") {
      console.log("[GENERATE-LINK] Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized: Provider access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      prescriptionId,
      consultationFeeCents,
      medicationCostCents,
      description,
      patientEmail,
      sendEmail,
    } = body;

    // Validate required fields
    if (
      !prescriptionId ||
      consultationFeeCents === undefined ||
      medicationCostCents === undefined
    ) {
      console.log("[GENERATE-LINK] Missing required fields");
      return NextResponse.json(
        {
          error:
            "Missing required fields: prescriptionId, consultationFeeCents, medicationCostCents",
        },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Get prescription details
    const { data: prescription, error: prescriptionError } = await supabase
      .from("prescriptions")
      .select(
        `
        id,
        patient_id,
        prescriber_id,
        pharmacy_id,
        medication,
        quantity,
        payment_status,
        patient:patients(id, first_name, last_name, email, phone),
        pharmacy:pharmacies(id, name)
      `,
      )
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      console.log("[GENERATE-LINK] Prescription not found");
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    // CHECK 1: If prescription is already paid, reject
    if (prescription.payment_status === "paid") {
      console.log("[GENERATE-LINK] Already paid");
      return NextResponse.json(
        { error: "This prescription has already been paid" },
        { status: 400 },
      );
    }

    // Verify the provider owns this prescription
    if (prescription.prescriber_id !== user.id) {
      console.log("[GENERATE-LINK] Permission denied");
      return NextResponse.json(
        { error: "You do not have permission to bill for this prescription" },
        { status: 403 },
      );
    }

    // CHECK 2: Look for existing payment_transaction for this prescription
    const { data: existingPayment } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("prescription_id", prescriptionId)
      .eq("payment_status", "pending")
      .single();

    if (existingPayment) {
      const isExpired = existingPayment.payment_link_expires_at &&
        new Date(existingPayment.payment_link_expires_at) < new Date();

      if (isExpired) {
        console.log("[GENERATE-LINK] Existing link expired, creating new");
        await supabase
          .from("payment_transactions")
          .delete()
          .eq("id", existingPayment.id);
      } else {
        console.log("[GENERATE-LINK] Returning existing link");
        // Payment link still valid - return existing link and resend email
        const patient = Array.isArray(prescription.patient)
          ? prescription.patient[0]
          : prescription.patient;

        const { data: provider } = await supabase
          .from("providers")
          .select("id, first_name, last_name")
          .eq("user_id", user.id)
          .single();

        // Resend email to patient
        let emailSent = false;
        const appUrl = envConfig.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";

        if (sendEmail && (patientEmail || patient?.email)) {
          try {
            const emailResponse = await fetch(
              `${appUrl}/api/payments/send-payment-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-internal-api-key": INTERNAL_API_KEY,
                },
                body: JSON.stringify({
                  patientEmail: patientEmail || patient?.email,
                  patientName: patient
                    ? `${patient.first_name} ${patient.last_name}`
                    : "Valued Patient",
                  providerName: provider
                    ? `${provider.first_name} ${provider.last_name}`
                    : "Your Provider",
                  medication: prescription.medication,
                  totalAmount: (existingPayment.total_amount_cents / 100).toFixed(2),
                  paymentUrl: existingPayment.payment_link_url,
                  paymentToken: existingPayment.payment_token,
                }),
              },
            );

            const emailData = await emailResponse.json();
            emailSent = emailData.success || false;
            if (emailSent) console.log("[GENERATE-LINK] Email resent");
          } catch {
            console.log("[GENERATE-LINK] Email resend failed");
          }
        }

        return NextResponse.json({
          success: true,
          existing: true,
          message: "A payment link was already generated for this prescription. Email has been resent.",
          paymentUrl: existingPayment.payment_link_url,
          paymentToken: existingPayment.payment_token,
          transactionId: existingPayment.id,
          expiresAt: existingPayment.payment_link_expires_at,
          emailSent,
        });
      }
    }

    // Get provider details
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, first_name, last_name")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      console.log("[GENERATE-LINK] Provider not found");
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 },
      );
    }

    // Validate Authorize.Net credentials are configured
    if (!envConfig.AUTHNET_API_LOGIN_ID || !envConfig.AUTHNET_TRANSACTION_KEY) {
      console.log("[GENERATE-LINK] Payment system not configured");
      return NextResponse.json(
        {
          error: "Payment system not configured. Please contact administrator.",
        },
        { status: 500 },
      );
    }

    // Calculate total amount
    const totalAmountCents = consultationFeeCents + medicationCostCents;
    const totalAmountDollars = (totalAmountCents / 100).toFixed(2);

    // Generate unique payment token (for patient magic link URL)
    const paymentToken = crypto.randomBytes(32).toString("hex");

    // Generate unique Authorize.Net reference ID (20 chars max for Authorize.Net compatibility)
    const authnetRefId = `PAY${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`.substring(0, 20);

    // Create payment transaction record
    const patient = Array.isArray(prescription.patient)
      ? prescription.patient[0]
      : prescription.patient;
    const pharmacy = Array.isArray(prescription.pharmacy)
      ? prescription.pharmacy[0]
      : prescription.pharmacy;

    console.log("[GENERATE-LINK] Creating transaction");

    const { data: paymentTransaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .insert({
        prescription_id: prescriptionId,
        total_amount_cents: totalAmountCents,
        consultation_fee_cents: consultationFeeCents,
        medication_cost_cents: medicationCostCents,
        patient_id: prescription.patient_id,
        patient_email: patient?.email,
        patient_phone: patient?.phone,
        patient_name: patient
          ? `${patient.first_name} ${patient.last_name}`
          : "Unknown",
        provider_id: provider.id,
        provider_name: `${provider.first_name} ${provider.last_name}`,
        pharmacy_id: prescription.pharmacy_id,
        pharmacy_name: pharmacy?.name,
        payment_token: paymentToken,
        authnet_ref_id: authnetRefId,
        payment_status: "pending",
        order_progress: "payment_pending",
        description:
          description ||
          `Payment for ${prescription.medication} - ${patient?.first_name} ${patient?.last_name}`,
        payment_link_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .select()
      .single();

    if (transactionError) {
      console.log("[GENERATE-LINK] Failed to create transaction");
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 },
      );
    }

    console.log("[GENERATE-LINK] Transaction created");

    // Use the hosted payment flow - redirect to our payment overview page
    // which will then redirect to Authorize.Net's hosted payment page
    const appUrl = envConfig.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";
    const fullPaymentUrl = `${appUrl}/payment/${paymentToken}`;

    // Update payment transaction with the payment URL
    await supabase
      .from("payment_transactions")
      .update({
        payment_link_url: fullPaymentUrl,
      })
      .eq("id", paymentTransaction.id);

    // Update prescription payment status
    await supabase
      .from("prescriptions")
      .update({
        payment_status: "pending",
        payment_transaction_id: paymentTransaction.id,
      })
      .eq("id", prescriptionId);

    console.log("[GENERATE-LINK] Prescription updated");

    // Send email to patient if requested
    let emailSent = false;
    if (sendEmail && (patientEmail || patient?.email)) {
      try {
        const emailResponse = await fetch(
          `${appUrl}/api/payments/send-payment-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-api-key": INTERNAL_API_KEY,
            },
            body: JSON.stringify({
              patientEmail: patientEmail || patient?.email,
              patientName: patient
                ? `${patient.first_name} ${patient.last_name}`
                : "Valued Patient",
              providerName: `${provider.first_name} ${provider.last_name}`,
              medication: prescription.medication,
              totalAmount: totalAmountDollars,
              paymentUrl: fullPaymentUrl,
              paymentToken,
            }),
          },
        );

        const emailData = await emailResponse.json();
        emailSent = emailData.success || false;
        if (emailSent) console.log("[GENERATE-LINK] Email sent");
      } catch {
        console.log("[GENERATE-LINK] Email failed");
      }
    }

    console.log("[GENERATE-LINK] Complete");

    return NextResponse.json({
      success: true,
      paymentUrl: fullPaymentUrl,
      paymentToken,
      transactionId: paymentTransaction.id,
      expiresAt: paymentTransaction.payment_link_expires_at,
      emailSent,
    });
  } catch (error) {
    console.error("[GENERATE-LINK] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate payment link",
      },
      { status: 500 },
    );
  }
}
