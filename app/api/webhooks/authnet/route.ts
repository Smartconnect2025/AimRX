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
  try {
    // Get raw body for signature validation
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    console.log("📥 Authorize.Net webhook received:", {
      eventType: body.eventType,
      payload: body.payload,
    });

    // Validate webhook signature (if signature key is configured)
    const signature = request.headers.get("x-anet-signature");
    if (signature) {
      const isValid = validateWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error("❌ Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Extract transaction data
    const { eventType, payload } = body;
    const transactionId = payload?.id;

    if (!transactionId) {
      console.error("❌ No transaction ID in webhook payload");
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
        console.log("ℹ️ Unhandled event type:", eventType);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("❌ Error processing Authorize.Net webhook:", error);
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

  if (!signatureKey) {
    console.warn("⚠️ AUTHNET_SIGNATURE_KEY not configured, skipping validation");
    // In production, you should return false here to enforce validation
    // For now, allow through to support initial setup
    return true;
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
  try {
    const { id: authnetTransactionId, invoiceNumber, refId, authAmount, accountNumber } = payload;

    console.log("✅ Processing payment success:", {
      authnetTransactionId,
      invoiceNumber,
      refId,
      amount: authAmount,
    });

    // Find payment transaction by refId (payment_token) first, then fall back to invoiceNumber
    let paymentTransaction = null;
    let findError = null;

    // Try to find by refId (payment_token) - this is the primary lookup method
    if (refId) {
      const result = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("payment_token", refId)
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
      console.error("❌ Payment transaction not found:", { refId, invoiceNumber });
      return;
    }

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
      })
      .eq("id", paymentTransaction.id);

    if (updateError) {
      console.error("❌ Error updating payment transaction:", updateError);
      return;
    }

    // Update prescription payment status
    if (paymentTransaction.prescription_id) {
      await supabase
        .from("prescriptions")
        .update({
          payment_status: "paid",
        })
        .eq("id", paymentTransaction.prescription_id);
    }

    console.log("✅ Payment processed successfully:", {
      transactionId: paymentTransaction.id,
      prescriptionId: paymentTransaction.prescription_id,
    });

    // TODO: Send email notification to patient
    // TODO: Send notification to provider
  } catch (error) {
    console.error("❌ Error handling payment success:", error);
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
    console.log("💰 Payment captured:", payload.id);

    // Update by authnet transaction ID
    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "completed",
        order_progress: "payment_received",
      })
      .eq("authnet_transaction_id", payload.id);
  } catch (error) {
    console.error("❌ Error handling payment capture:", error);
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
    console.log("🚫 Payment voided:", payload.id);

    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "cancelled",
      })
      .eq("authnet_transaction_id", payload.id);
  } catch (error) {
    console.error("❌ Error handling payment void:", error);
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
    console.log("↩️ Payment refunded:", payload.id, payload.refundAmount);

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
  } catch (error) {
    console.error("❌ Error handling payment refund:", error);
  }
}
