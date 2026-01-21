import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";
import { envConfig } from "@/core/config/envConfig";
import crypto from "crypto";

/**
 * POST /api/payments/generate-link
 * Generate a payment link for a prescription
 * This creates a unique token and payment URL that can be sent to the patient
 */
export async function POST(request: NextRequest) {
  console.log("[PAYMENT:generate-link] ========== START ==========");

  try {
    console.log("[PAYMENT:generate-link] Getting user...");
    const { user, userRole } = await getUser();
    console.log("[PAYMENT:generate-link] User:", { userId: user?.id, userRole });

    if (!user || userRole !== "provider") {
      console.log("[PAYMENT:generate-link] ERROR: Unauthorized - not a provider");
      return NextResponse.json(
        { error: "Unauthorized: Provider access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    console.log("[PAYMENT:generate-link] Request body:", {
      prescriptionId: body.prescriptionId,
      consultationFeeCents: body.consultationFeeCents,
      medicationCostCents: body.medicationCostCents,
      patientEmail: body.patientEmail,
      sendEmail: body.sendEmail,
    });
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
      console.log("[PAYMENT:generate-link] ERROR: Missing required fields", {
        prescriptionId,
        consultationFeeCents,
        medicationCostCents,
      });
      return NextResponse.json(
        {
          error:
            "Missing required fields: prescriptionId, consultationFeeCents, medicationCostCents",
        },
        { status: 400 },
      );
    }

    console.log("[PAYMENT:generate-link] Validation passed, creating admin client...");

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
      console.log("[PAYMENT:generate-link] ERROR: Prescription not found", {
        prescriptionId,
        error: prescriptionError,
      });
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    console.log("[PAYMENT:generate-link] Prescription found:", {
      prescriptionId: prescription.id,
      patientId: prescription.patient_id,
      prescriberId: prescription.prescriber_id,
      paymentStatus: prescription.payment_status,
    });

    // CHECK 1: If prescription is already paid, reject
    if (prescription.payment_status === "paid") {
      console.log("[PAYMENT:generate-link] ERROR: Prescription already paid");
      return NextResponse.json(
        { error: "This prescription has already been paid" },
        { status: 400 },
      );
    }

    // Verify the provider owns this prescription
    if (prescription.prescriber_id !== user.id) {
      console.log("[PAYMENT:generate-link] ERROR: Provider mismatch", {
        prescriberId: prescription.prescriber_id,
        userId: user.id,
      });
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
        // Payment link expired - delete it and continue to create new one
        console.log("[PAYMENT:generate-link] Existing payment link expired, deleting...", {
          transactionId: existingPayment.id,
          expiredAt: existingPayment.payment_link_expires_at,
        });

        await supabase
          .from("payment_transactions")
          .delete()
          .eq("id", existingPayment.id);

        console.log("[PAYMENT:generate-link] Expired payment transaction deleted");
      } else {
        // Payment link still valid - return existing link and resend email
        console.log("[PAYMENT:generate-link] Existing valid payment link found", {
          transactionId: existingPayment.id,
          paymentToken: existingPayment.payment_token?.substring(0, 16) + "...",
          expiresAt: existingPayment.payment_link_expires_at,
        });

        // Get patient info for email
        const patient = Array.isArray(prescription.patient)
          ? prescription.patient[0]
          : prescription.patient;

        // Get provider details for email
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
                headers: { "Content-Type": "application/json" },
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

            if (emailSent) {
              console.log("[PAYMENT:generate-link] Payment email resent to:", patientEmail || patient?.email);
            }
          } catch (emailError) {
            console.error("[PAYMENT:generate-link] Error resending payment email:", emailError);
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

    console.log("[PAYMENT:generate-link] Provider authorized, fetching provider details...");

    // Get provider details
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, first_name, last_name")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      console.log("[PAYMENT:generate-link] ERROR: Provider profile not found", {
        userId: user.id,
        error: providerError,
      });
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 },
      );
    }

    console.log("[PAYMENT:generate-link] Provider found:", {
      providerId: provider.id,
      providerName: `${provider.first_name} ${provider.last_name}`,
    });

    // Validate Authorize.Net credentials are configured via environment variables
    console.log("[PAYMENT:generate-link] Checking Authorize.Net credentials...", {
      hasLoginId: !!envConfig.AUTHNET_API_LOGIN_ID,
      hasTransactionKey: !!envConfig.AUTHNET_TRANSACTION_KEY,
      environment: envConfig.AUTHNET_ENVIRONMENT,
    });

    if (!envConfig.AUTHNET_API_LOGIN_ID || !envConfig.AUTHNET_TRANSACTION_KEY) {
      console.log("[PAYMENT:generate-link] ERROR: Authorize.Net credentials not configured");
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

    console.log("[PAYMENT:generate-link] Amount calculated:", {
      consultationFeeCents,
      medicationCostCents,
      totalAmountCents,
      totalAmountDollars,
    });

    // Generate unique payment token (for patient magic link URL)
    const paymentToken = crypto.randomBytes(32).toString("hex");
    console.log("[PAYMENT:generate-link] Generated payment token:", paymentToken.substring(0, 16) + "...");

    // Generate unique Authorize.Net reference ID (20 chars max for Authorize.Net compatibility)
    // Format: "PAY" + timestamp base36 + random chars = exactly 20 chars
    const authnetRefId = `PAY${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`.substring(0, 20);
    console.log("[PAYMENT:generate-link] Generated authnet_ref_id:", authnetRefId);

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
      console.log("[PAYMENT:generate-link] ERROR: Failed to create payment transaction", transactionError);
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 },
      );
    }

    console.log("[PAYMENT:generate-link] Payment transaction created:", {
      transactionId: paymentTransaction.id,
      paymentToken: paymentToken.substring(0, 16) + "...",
    });

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

    console.log("[PAYMENT:generate-link] Payment link URL updated:", fullPaymentUrl);
    console.log("[PAYMENT:generate-link] Prescription payment status updated to pending");

    // Send email to patient if requested
    let emailSent = false;
    if (sendEmail && (patientEmail || patient?.email)) {
      try {
        const emailResponse = await fetch(
          `${appUrl}/api/payments/send-payment-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

        if (emailSent) {
          console.log(
            "✅ Payment email sent to:",
            patientEmail || patient?.email,
          );
        } else {
          console.error("❌ Failed to send payment email:", emailData.error);
        }
      } catch (emailError) {
        console.error("❌ Error sending payment email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    console.log("[PAYMENT:generate-link] SUCCESS - Returning response:", {
      paymentUrl: fullPaymentUrl,
      transactionId: paymentTransaction.id,
      emailSent,
    });
    console.log("[PAYMENT:generate-link] ========== END ==========");

    return NextResponse.json({
      success: true,
      paymentUrl: fullPaymentUrl,
      paymentToken,
      transactionId: paymentTransaction.id,
      expiresAt: paymentTransaction.payment_link_expires_at,
      emailSent,
    });
  } catch (error) {
    console.log("[PAYMENT:generate-link] FATAL ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate payment link",
      },
      { status: 500 },
    );
  }
}
