import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";
import crypto from "crypto";

/**
 * POST /api/payments/generate-link
 * Generate a payment link for a prescription
 * This creates a unique token and payment URL that can be sent to the patient
 */
export async function POST(request: NextRequest) {
  try {
    const { user, userRole } = await getUser();

    if (!user || userRole !== "provider") {
      return NextResponse.json(
        { error: "Unauthorized: Provider access required" },
        { status: 403 }
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
    if (!prescriptionId || consultationFeeCents === undefined || medicationCostCents === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: prescriptionId, consultationFeeCents, medicationCostCents" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get prescription details
    const { data: prescription, error: prescriptionError } = await supabase
      .from("prescriptions")
      .select(`
        id,
        patient_id,
        prescriber_id,
        pharmacy_id,
        medication,
        quantity,
        patient:patients(id, first_name, last_name, email, phone),
        pharmacy:pharmacies(id, name)
      `)
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    // Verify the provider owns this prescription
    if (prescription.prescriber_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to bill for this prescription" },
        { status: 403 }
      );
    }

    // Get provider details
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, first_name, last_name")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    // Get AMRX payment credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from("payment_credentials")
      .select("*")
      .eq("is_active", true)
      .single();

    if (credentialsError || !credentials) {
      console.error("❌ Payment credentials error:", credentialsError);
      console.log("📊 Checking all payment credentials in database...");
      const { data: allCreds } = await supabase
        .from("payment_credentials")
        .select("id, merchant_name, environment, is_active, created_at");
      console.log("All credentials found:", allCreds);

      return NextResponse.json(
        { error: "Payment system not configured. Please contact administrator." },
        { status: 500 }
      );
    }

    // Calculate total amount
    // (No need to decrypt transaction key here - it's only needed when processing payment)
    const totalAmountCents = consultationFeeCents + medicationCostCents;
    const totalAmountDollars = (totalAmountCents / 100).toFixed(2);

    // Generate unique payment token
    const paymentToken = crypto.randomBytes(32).toString("hex");

    // Create payment transaction record
    const patient = Array.isArray(prescription.patient)
      ? prescription.patient[0]
      : prescription.patient;
    const pharmacy = Array.isArray(prescription.pharmacy)
      ? prescription.pharmacy[0]
      : prescription.pharmacy;

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
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown",
        provider_id: provider.id,
        provider_name: `${provider.first_name} ${provider.last_name}`,
        pharmacy_id: prescription.pharmacy_id,
        pharmacy_name: pharmacy?.name,
        payment_token: paymentToken,
        payment_status: "pending",
        order_progress: "payment_pending",
        description: description || `Payment for ${prescription.medication}`,
        prescription_medication: prescription.medication,
        payment_link_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating payment transaction:", transactionError);
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 });
    }

    // Use our own direct payment page - no need to call Authorize.Net API here
    // Payment will be processed when user submits the form on our payment page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://3007.app.specode.ai";
    const fullPaymentUrl = `${appUrl}/payment/direct/${paymentToken}`;

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

    console.log("✅ Payment link generated successfully:", {
      transactionId: paymentTransaction.id,
      paymentUrl: fullPaymentUrl,
    });

    // Send email to patient if requested
    let emailSent = false;
    if (sendEmail && (patientEmail || patient?.email)) {
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://3007.app.specode.ai"}/api/payments/send-payment-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientEmail: patientEmail || patient?.email,
            patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Valued Patient",
            providerName: `${provider.first_name} ${provider.last_name}`,
            medication: prescription.medication,
            totalAmount: totalAmountDollars,
            paymentUrl: fullPaymentUrl,
            paymentToken,
          }),
        });

        const emailData = await emailResponse.json();
        emailSent = emailData.success || false;

        if (emailSent) {
          console.log("✅ Payment email sent to:", patientEmail || patient?.email);
        } else {
          console.error("❌ Failed to send payment email:", emailData.error);
        }
      } catch (emailError) {
        console.error("❌ Error sending payment email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      paymentUrl: fullPaymentUrl,
      paymentToken,
      transactionId: paymentTransaction.id,
      expiresAt: paymentTransaction.payment_link_expires_at,
      emailSent,
    });
  } catch (error) {
    console.error("Error generating payment link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate payment link",
      },
      { status: 500 }
    );
  }
}
