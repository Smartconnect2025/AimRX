import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";
import { decryptAuthNetKey } from "@/core/services/encryption/authnet-encryption";
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

    // Decrypt the transaction key
    let transactionKey: string;
    try {
      transactionKey = decryptAuthNetKey(credentials.transaction_key_encrypted);
    } catch (error) {
      console.error("Failed to decrypt transaction key:", error);
      return NextResponse.json(
        { error: "Payment system configuration error" },
        { status: 500 }
      );
    }

    // Calculate total amount
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
        payment_link_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating payment transaction:", transactionError);
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 });
    }

    // Generate Authorize.Net hosted payment page token
    const authnetApiUrl =
      credentials.environment === "live"
        ? "https://api.authorize.net/xml/v1/request.api"
        : "https://apitest.authorize.net/xml/v1/request.api";

    // Build the hosted payment page request
    const hostedPaymentRequest = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: {
          name: credentials.api_login_id,
          transactionKey: transactionKey,
        },
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: totalAmountDollars,
          order: {
            invoiceNumber: paymentTransaction.id,
            description: paymentTransaction.description,
          },
          customer: {
            email: patient?.email,
          },
          billTo: {
            firstName: patient?.first_name || "",
            lastName: patient?.last_name || "",
            email: patient?.email || "",
            phoneNumber: patient?.phone || "",
          },
        },
        hostedPaymentSettings: {
          setting: [
            {
              settingName: "hostedPaymentReturnOptions",
              settingValue: JSON.stringify({
                showReceipt: true,
                url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3007"}/payment/success/${paymentToken}`,
                urlText: "Continue",
                cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3007"}/payment/cancelled/${paymentToken}`,
                cancelUrlText: "Cancel",
              }),
            },
            {
              settingName: "hostedPaymentButtonOptions",
              settingValue: JSON.stringify({
                text: `Pay $${totalAmountDollars}`,
              }),
            },
            {
              settingName: "hostedPaymentStyleOptions",
              settingValue: JSON.stringify({
                bgColor: "#FFFFFF",
              }),
            },
          ],
        },
      },
    };

    console.log("Requesting Authorize.Net hosted payment page for:", {
      transactionId: paymentTransaction.id,
      amount: totalAmountDollars,
      patient: patient?.email,
    });

    let authnetResponse;
    let authnetData;

    try {
      authnetResponse = await fetch(authnetApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hostedPaymentRequest),
      });

      authnetData = await authnetResponse.json();
      console.log("Authorize.Net response:", authnetData);
    } catch (authnetError) {
      console.error("❌ Failed to connect to Authorize.Net API:", authnetError);

      // Mark transaction as failed
      await supabase
        .from("payment_transactions")
        .update({ payment_status: "failed" })
        .eq("id", paymentTransaction.id);

      return NextResponse.json({
        error: "Unable to connect to payment processor. Please check payment credentials.",
        details: authnetError instanceof Error ? authnetError.message : String(authnetError)
      }, { status: 500 });
    }

    // Check if token generation was successful
    if (authnetData.messages?.resultCode !== "Ok") {
      const errorMessage =
        authnetData.messages?.message?.[0]?.text || "Failed to generate payment link";

      console.error("Authorize.Net error:", errorMessage);
      console.error("Full Authorize.Net response:", JSON.stringify(authnetData, null, 2));

      // Mark transaction as failed
      await supabase
        .from("payment_transactions")
        .update({ payment_status: "failed" })
        .eq("id", paymentTransaction.id);

      return NextResponse.json({
        error: errorMessage,
        details: authnetData.messages?.message || []
      }, { status: 500 });
    }

    // Extract the hosted payment page token
    const hostedPaymentToken = authnetData.token;

    // Build the payment URL
    const paymentUrl =
      credentials.environment === "live"
        ? `https://accept.authorize.net/payment/payment`
        : `https://test.authorize.net/payment/payment`;

    const fullPaymentUrl = `${paymentUrl}?token=${hostedPaymentToken}`;

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
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3007"}/api/payments/send-payment-email`, {
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
