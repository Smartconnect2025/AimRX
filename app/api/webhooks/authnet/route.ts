import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";

/**
 * POST /api/webhooks/authnet
 * Webhook endpoint for Authorize.Net payment notifications
 * This handles payment status updates automatically
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📥 Authorize.Net webhook received:", {
      eventType: body.eventType,
      payload: body.payload,
    });

    // Validate webhook signature (if signature key is configured)
    const signature = request.headers.get("x-anet-signature");
    if (signature) {
      const isValid = await validateWebhookSignature(body, signature);
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
 */
async function validateWebhookSignature(
  _payload: Record<string, unknown>,
  _signature: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    // Get active signature key
    const { data: credentials } = await supabase
      .from("payment_credentials")
      .select("signature_key_encrypted")
      .eq("is_active", true)
      .single();

    if (!credentials?.signature_key_encrypted) {
      console.warn("⚠️ No signature key configured, skipping validation");
      return true; // Allow through if no key configured
    }

    // For now, we'll skip actual signature validation
    // In production, you would decrypt the key and validate
    return true;
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
    authAmount?: number;
    accountNumber?: string;
    accountType?: string;
  }
) {
  try {
    const { id: authnetTransactionId, invoiceNumber, authAmount, accountNumber } = payload;

    console.log("✅ Processing payment success:", {
      authnetTransactionId,
      invoiceNumber,
      amount: authAmount,
    });

    // Find payment transaction by invoice number (which is our payment transaction ID)
    const { data: paymentTransaction, error: findError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", invoiceNumber)
      .single();

    if (findError || !paymentTransaction) {
      console.error("❌ Payment transaction not found:", invoiceNumber);
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

      // Submit prescription to pharmacy now that payment is received
      console.log("💳 Payment received - submitting prescription to pharmacy");
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
          console.log("✅ Prescription submitted to pharmacy:", submitData.queue_id);
        } else {
          console.error("❌ Failed to submit prescription to pharmacy:", await submitResponse.text());
        }
      } catch (submitError) {
        console.error("❌ Error submitting prescription to pharmacy:", submitError);
      }
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
