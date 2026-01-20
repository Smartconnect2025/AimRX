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
  console.log("[WEBHOOK:authnet] ========== START ==========");

  try {
    // Get raw body for signature validation
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log("[WEBHOOK:authnet] Webhook received:", {
      eventType: body.eventType,
      transactionId: body.payload?.id,
      refId: body.payload?.refId,
      invoiceNumber: body.payload?.invoiceNumber,
      authAmount: body.payload?.authAmount,
    });

    // Validate webhook signature (if signature key is configured)
    const signature = request.headers.get("x-anet-signature");
    console.log("[WEBHOOK:authnet] Signature validation:", {
      hasSignature: !!signature,
      hasSignatureKey: !!envConfig.AUTHNET_SIGNATURE_KEY,
    });

    if (signature) {
      const isValid = validateWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.log("[WEBHOOK:authnet] ERROR: Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.log("[WEBHOOK:authnet] Signature validated successfully");
    } else {
      console.log("[WEBHOOK:authnet] WARNING: No signature provided in request");
    }

    // Extract transaction data
    const { eventType, payload } = body;
    const transactionId = payload?.id;

    if (!transactionId) {
      console.log("[WEBHOOK:authnet] ERROR: No transaction ID in payload");
      return NextResponse.json({ error: "No transaction ID" }, { status: 400 });
    }

    console.log("[WEBHOOK:authnet] Processing event:", eventType);

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
        console.log("[WEBHOOK:authnet] Unhandled event type:", eventType);
    }

    console.log("[WEBHOOK:authnet] SUCCESS - Webhook processed");
    console.log("[WEBHOOK:authnet] ========== END ==========");

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.log("[WEBHOOK:authnet] FATAL ERROR:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Validate webhook signature using HMAC-SHA512
 * Authorize.Net sends signature in format: sha512=HASH
 */
function validateWebhookSignature(
  rawPayload: string,
  signature: string
): boolean {
  const signatureKey = envConfig.AUTHNET_SIGNATURE_KEY;

  console.log("[WEBHOOK:authnet] validateWebhookSignature called:", {
    hasSignatureKey: !!signatureKey,
    signatureLength: signature?.length,
  });

  if (!signatureKey) {
    // SECURITY: Always reject webhooks when signature key is not configured
    // This prevents accepting unverified/forged webhooks
    console.log("[WEBHOOK:authnet] ERROR: AUTHNET_SIGNATURE_KEY not configured - rejecting webhook");
    return false;
  }

  try {
    // Authorize.Net sends the signature as the raw hash (no prefix)
    // Compute HMAC-SHA512 of the raw request body
    const computed = crypto
      .createHmac("sha512", signatureKey)
      .update(rawPayload)
      .digest("hex")
      .toUpperCase();

    const providedSignature = signature.toUpperCase();

    // Use timing-safe comparison to prevent timing attacks
    if (computed.length !== providedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(providedSignature)
    );
  } catch (error) {
    console.error("Error validating webhook signature:", error);
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
    refId?: string; // This is our payment_token
    authAmount?: number;
    accountNumber?: string;
    accountType?: string;
  }
) {
  console.log("[WEBHOOK:authnet:handlePaymentSuccess] ========== START ==========");

  try {
    const { id: authnetTransactionId, invoiceNumber, refId, authAmount, accountNumber } = payload;

    console.log("[WEBHOOK:authnet:handlePaymentSuccess] Payload received:", {
      authnetTransactionId,
      invoiceNumber,
      refId: refId?.substring(0, 16) + "...",
      amount: authAmount,
      accountNumber: accountNumber ? "****" + accountNumber.slice(-4) : null,
    });

    // Find payment transaction by refId (payment_token) first, then fall back to invoiceNumber
    let paymentTransaction = null;
    let findError = null;

    // Try to find by refId (transaction ID prefix) - this is the primary lookup method
    // Note: refId is truncated to 20 chars due to Authorize.Net limits
    if (refId) {
      const result = await supabase
        .from("payment_transactions")
        .select("*")
        .ilike("id", `${refId}%`)
        .single();
      paymentTransaction = result.data;
      findError = result.error;
    }

    // Fall back to invoiceNumber (transaction ID substring) if refId not found
    if (!paymentTransaction && invoiceNumber) {
      const result = await supabase
        .from("payment_transactions")
        .select("*")
        .ilike("id", `${invoiceNumber}%`)
        .single();
      paymentTransaction = result.data;
      findError = result.error;
    }

    if (findError || !paymentTransaction) {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] ERROR: Payment transaction not found", {
        refId,
        invoiceNumber,
        error: findError,
      });
      return;
    }

    console.log("[WEBHOOK:authnet:handlePaymentSuccess] Payment transaction found:", {
      transactionId: paymentTransaction.id,
      currentStatus: paymentTransaction.payment_status,
      prescriptionId: paymentTransaction.prescription_id,
    });

    // Get last 4 digits of card
    const cardLastFour = accountNumber?.slice(-4);

    // Update payment transaction
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
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] ERROR: Failed to update payment transaction", updateError);
      return;
    }

    console.log("[WEBHOOK:authnet:handlePaymentSuccess] Payment transaction updated to completed");

    // Update prescription payment status
    if (paymentTransaction.prescription_id) {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Updating prescription payment status:", paymentTransaction.prescription_id);

      await supabase
        .from("prescriptions")
        .update({
          payment_status: "paid",
        })
        .eq("id", paymentTransaction.prescription_id);

      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Prescription updated to paid, submitting to pharmacy...");
      try {
        const submitResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/prescriptions/${paymentTransaction.prescription_id}/submit-to-pharmacy`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (submitResponse.ok) {
          const submitData = await submitResponse.json();
          console.log("[WEBHOOK:authnet:handlePaymentSuccess] Prescription submitted to pharmacy:", submitData.queue_id);
        } else {
          const errorText = await submitResponse.text();
          console.log("[WEBHOOK:authnet:handlePaymentSuccess] ERROR: Failed to submit prescription to pharmacy:", errorText);
        }
      } catch (submitError) {
        console.log("[WEBHOOK:authnet:handlePaymentSuccess] ERROR: Exception submitting prescription:", submitError);
      }
    } else {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] No prescription_id found, skipping pharmacy submission");
    }

    console.log("[WEBHOOK:authnet:handlePaymentSuccess] SUCCESS - Payment processed:", {
      transactionId: paymentTransaction.id,
      prescriptionId: paymentTransaction.prescription_id,
    });
    console.log("[WEBHOOK:authnet:handlePaymentSuccess] ========== END ==========");

    // TODO: Send email notification to patient
    // TODO: Send notification to provider
  } catch (error) {
    console.log("[WEBHOOK:authnet:handlePaymentSuccess] FATAL ERROR:", error);
  }
}

/**
 * Handle payment captured (when auth is captured later)
 */
async function handlePaymentCaptured(
  supabase: ReturnType<typeof createAdminClient>,
  payload: { id: string }
) {
  try {
    console.log("[WEBHOOK:authnet:handlePaymentCaptured] Capturing payment:", payload.id);

    // Update by authnet transaction ID
    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "completed",
        order_progress: "payment_received",
      })
      .eq("authnet_transaction_id", payload.id);

    console.log("[WEBHOOK:authnet:handlePaymentCaptured] Payment captured successfully");
  } catch (error) {
    console.log("[WEBHOOK:authnet:handlePaymentCaptured] ERROR:", error);
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
    console.log("[WEBHOOK:authnet:handlePaymentVoided] Voiding payment:", payload.id);

    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "cancelled",
      })
      .eq("authnet_transaction_id", payload.id);

    console.log("[WEBHOOK:authnet:handlePaymentVoided] Payment voided successfully");
  } catch (error) {
    console.log("[WEBHOOK:authnet:handlePaymentVoided] ERROR:", error);
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
    console.log("[WEBHOOK:authnet:handlePaymentRefunded] Refunding payment:", {
      transactionId: payload.id,
      refundAmount: payload.refundAmount,
    });

    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "refunded",
        refund_amount_cents: payload.refundAmount
          ? Math.round(payload.refundAmount * 100)
          : null,
        refunded_at: new Date().toISOString(),
      })
      .eq("authnet_transaction_id", payload.id);

    console.log("[WEBHOOK:authnet:handlePaymentRefunded] Payment refunded successfully");
  } catch (error) {
    console.log("[WEBHOOK:authnet:handlePaymentRefunded] ERROR:", error);
  }
}
