import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { envConfig } from "@/core/config/envConfig";
import crypto from "crypto";

/**
 * POST /api/webhooks/authnet
 * Webhook endpoint for Authorize.Net payment notifications
 * This handles payment status updates automatically
 */
export async function POST(request: NextRequest) {
  console.log("[WEBHOOK] Received");

  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { eventType, payload } = body;

    console.log("[WEBHOOK] Event:", eventType);

    // Validate webhook signature
    const signature = request.headers.get("x-anet-signature");
    if (signature) {
      const isValid = validateWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.log("[WEBHOOK] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.log("[WEBHOOK] Signature OK");
    }

    const transactionId = payload?.id;
    if (!transactionId) {
      console.log("[WEBHOOK] Missing transaction ID");
      return NextResponse.json({ error: "No transaction ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Handle different event types
    switch (eventType) {
      case "net.authorize.payment.authorization.created":
      case "net.authorize.payment.authcapture.created":
        await handlePaymentSuccess(supabase, payload);
        break;

      case "net.authorize.payment.capture.created":
        await handlePaymentCaptured(supabase, payload);
        break;

      case "net.authorize.payment.void.created":
        await handlePaymentVoided(supabase, payload);
        break;

      case "net.authorize.payment.refund.created":
        await handlePaymentRefunded(supabase, payload);
        break;

      default:
        console.log("[WEBHOOK] Unhandled event type");
    }

    console.log("[WEBHOOK] Done");
    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 * Validate webhook signature using HMAC-SHA512
 */
function validateWebhookSignature(rawPayload: string, signature: string): boolean {
  const signatureKey = envConfig.AUTHNET_SIGNATURE_KEY;

  if (!signatureKey) {
    console.log("[WEBHOOK] No signature key configured");
    return false;
  }

  try {
    let providedSignature = signature;
    if (providedSignature.toLowerCase().startsWith("sha512=")) {
      providedSignature = providedSignature.substring(7);
    }

    const computed = crypto
      .createHmac("sha512", signatureKey)
      .update(rawPayload)
      .digest("hex")
      .toUpperCase();

    providedSignature = providedSignature.toUpperCase();

    if (computed.length !== providedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(providedSignature));
  } catch {
    return false;
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    id: string;
    invoiceNumber?: string;
    refId?: string;
    authAmount?: number;
    accountNumber?: string;
    accountType?: string;
  }
) {
  console.log("[WEBHOOK] Processing payment success");

  try {
    const { id: authnetTransactionId, invoiceNumber, refId, authAmount, accountNumber } = payload;

    // IDEMPOTENCY CHECK: Skip if already processed
    const { data: alreadyProcessed } = await supabase
      .from("payment_transactions")
      .select("id, payment_status")
      .eq("authnet_transaction_id", authnetTransactionId)
      .single();

    if (alreadyProcessed) {
      console.log("[WEBHOOK] Already processed, skipping");
      return;
    }

    // Find payment transaction by authnet_ref_id
    let paymentTransaction = null;

    if (invoiceNumber) {
      const result = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("authnet_ref_id", invoiceNumber)
        .single();
      paymentTransaction = result.data;
    }

    if (!paymentTransaction && refId) {
      const result = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("authnet_ref_id", refId)
        .single();
      paymentTransaction = result.data;
    }

    if (!paymentTransaction) {
      console.log("[WEBHOOK] Transaction not found");
      return;
    }

    console.log("[WEBHOOK] Transaction found");

    // SECOND IDEMPOTENCY CHECK
    if (paymentTransaction.payment_status === "completed") {
      console.log("[WEBHOOK] Already completed, skipping");
      return;
    }

    // AMOUNT VALIDATION
    if (authAmount !== undefined) {
      const expectedAmountDollars = paymentTransaction.total_amount_cents / 100;
      const amountDifference = Math.abs(authAmount - expectedAmountDollars);

      if (amountDifference > 1) {
        console.error("[WEBHOOK] Amount mismatch - rejecting");
        return;
      }
      console.log("[WEBHOOK] Amount validated");
    }

    // Update payment transaction
    const cardLastFour = accountNumber?.slice(-4);
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        payment_status: "completed",
        order_progress: "payment_received",
        authnet_transaction_id: authnetTransactionId,
        card_last_four: cardLastFour,
        card_type: payload.accountType,
        paid_at: new Date().toISOString(),
        webhook_received_at: new Date().toISOString(),
        webhook_payload: payload,
      })
      .eq("id", paymentTransaction.id);

    if (updateError) {
      console.log("[WEBHOOK] Failed to update transaction");
      return;
    }

    console.log("[WEBHOOK] Transaction updated");

    // Update prescription
    if (paymentTransaction.prescription_id) {
      const { error: prescriptionUpdateError } = await supabase
        .from("prescriptions")
        .update({
          payment_status: "paid",
          order_progress: "payment_received",
          status: "payment_received",
        })
        .eq("id", paymentTransaction.prescription_id);

      if (prescriptionUpdateError) {
        console.log("[WEBHOOK] Failed to update prescription");
      } else {
        console.log("[WEBHOOK] Prescription updated");
      }

      // Submit to pharmacy
      console.log("[WEBHOOK] Submitting to pharmacy");
      try {
        const submitResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/prescriptions/${paymentTransaction.prescription_id}/submit-to-pharmacy`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (submitResponse.ok) {
          console.log("[WEBHOOK] Pharmacy submission OK");
          await supabase
            .from("payment_transactions")
            .update({ order_progress: "pharmacy_processing" })
            .eq("id", paymentTransaction.id);
        } else {
          console.log("[WEBHOOK] Pharmacy submission failed");
        }
      } catch {
        console.log("[WEBHOOK] Pharmacy submission error");
      }
    }

    // Send confirmation email
    if (paymentTransaction.patient_email) {
      console.log("[WEBHOOK] Sending confirmation email");
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const emailResponse = await fetch(`${siteUrl}/api/payments/send-confirmation-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-api-key": process.env.INTERNAL_API_KEY || "",
          },
          body: JSON.stringify({
            patientEmail: paymentTransaction.patient_email,
            patientName: paymentTransaction.patient_name,
            providerName: paymentTransaction.provider_name,
            medication: paymentTransaction.description,
            totalAmount: (paymentTransaction.total_amount_cents / 100).toFixed(2),
            transactionId: authnetTransactionId,
            pharmacyName: paymentTransaction.pharmacy_name,
          }),
        });

        if (emailResponse.ok) {
          console.log("[WEBHOOK] Email sent");
        } else {
          console.log("[WEBHOOK] Email failed");
        }
      } catch {
        console.log("[WEBHOOK] Email error");
      }
    }

    console.log("[WEBHOOK] Payment success complete");
  } catch (error) {
    console.error("[WEBHOOK] Error:", error instanceof Error ? error.message : "Unknown");
  }
}

/**
 * Handle payment captured
 */
async function handlePaymentCaptured(
  supabase: ReturnType<typeof createAdminClient>,
  payload: { id: string }
) {
  try {
    console.log("[WEBHOOK] Processing capture");
    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "completed",
        order_progress: "payment_received",
      })
      .eq("authnet_transaction_id", payload.id);
    console.log("[WEBHOOK] Capture complete");
  } catch {
    console.log("[WEBHOOK] Capture error");
  }
}

/**
 * Handle payment voided
 */
async function handlePaymentVoided(
  supabase: ReturnType<typeof createAdminClient>,
  payload: { id: string }
) {
  try {
    console.log("[WEBHOOK] Processing void");
    await supabase
      .from("payment_transactions")
      .update({ payment_status: "cancelled" })
      .eq("authnet_transaction_id", payload.id);
    console.log("[WEBHOOK] Void complete");
  } catch {
    console.log("[WEBHOOK] Void error");
  }
}

/**
 * Handle payment refunded
 */
async function handlePaymentRefunded(
  supabase: ReturnType<typeof createAdminClient>,
  payload: { id: string; refundAmount?: number }
) {
  try {
    console.log("[WEBHOOK] Processing refund");
    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "refunded",
        refund_amount_cents: payload.refundAmount ? Math.round(payload.refundAmount * 100) : null,
        refunded_at: new Date().toISOString(),
      })
      .eq("authnet_transaction_id", payload.id);
    console.log("[WEBHOOK] Refund complete");
  } catch {
    console.log("[WEBHOOK] Refund error");
  }
}
