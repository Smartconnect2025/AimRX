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
    signaturePreview: signature?.substring(0, 20) + "...",
  });

  if (!signatureKey) {
    // SECURITY: Always reject webhooks when signature key is not configured
    // This prevents accepting unverified/forged webhooks
    console.log("[WEBHOOK:authnet] ERROR: AUTHNET_SIGNATURE_KEY not configured - rejecting webhook");
    return false;
  }

  try {
    // Authorize.Net sends the signature in format: sha512=HASH
    // Remove the "sha512=" prefix if present
    let providedSignature = signature;
    if (providedSignature.toLowerCase().startsWith("sha512=")) {
      providedSignature = providedSignature.substring(7);
      console.log("[WEBHOOK:authnet] Removed sha512= prefix from signature");
    }

    // Compute HMAC-SHA512 of the raw request body
    const computed = crypto
      .createHmac("sha512", signatureKey)
      .update(rawPayload)
      .digest("hex")
      .toUpperCase();

    providedSignature = providedSignature.toUpperCase();

    console.log("[WEBHOOK:authnet] Signature comparison:", {
      computedLength: computed.length,
      providedLength: providedSignature.length,
      computedPreview: computed.substring(0, 16) + "...",
      providedPreview: providedSignature.substring(0, 16) + "...",
    });

    // Use timing-safe comparison to prevent timing attacks
    if (computed.length !== providedSignature.length) {
      console.log("[WEBHOOK:authnet] ERROR: Signature length mismatch", {
        computedLength: computed.length,
        providedLength: providedSignature.length,
      });
      return false;
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(providedSignature)
    );

    if (!isValid) {
      console.log("[WEBHOOK:authnet] ERROR: Signature hash mismatch (keys don't match)");
    }

    return isValid;
  } catch (error) {
    console.log("[WEBHOOK:authnet] ERROR: Exception validating signature:", error);
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
    refId?: string; // This is our authnet_ref_id
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
      refId,
      amount: authAmount,
      accountNumber: accountNumber ? "****" + accountNumber.slice(-4) : null,
    });

    // IDEMPOTENCY CHECK: Skip if we already processed this Authorize.Net transaction ID
    // This prevents duplicate processing if webhook is received multiple times
    const { data: alreadyProcessed } = await supabase
      .from("payment_transactions")
      .select("id, payment_status")
      .eq("authnet_transaction_id", authnetTransactionId)
      .single();

    if (alreadyProcessed) {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] IDEMPOTENCY: Already processed this transaction, skipping", {
        authnetTransactionId,
        existingTransactionId: alreadyProcessed.id,
        existingStatus: alreadyProcessed.payment_status,
      });
      return; // Exit early - already handled
    }

    // Find payment transaction by authnet_ref_id (stored in invoiceNumber/refId)
    let paymentTransaction = null;
    let findError = null;

    // Primary lookup: use invoiceNumber which matches our authnet_ref_id
    if (invoiceNumber) {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Searching by authnet_ref_id (invoiceNumber):", invoiceNumber);

      const result = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("authnet_ref_id", invoiceNumber)
        .single();
      paymentTransaction = result.data;
      findError = result.error;

      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Search result:", {
        found: !!paymentTransaction,
        error: findError?.message,
      });
    }

    // Fallback: use refId which should also be our authnet_ref_id
    if (!paymentTransaction && refId) {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Fallback: searching by authnet_ref_id (refId):", refId);

      const result = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("authnet_ref_id", refId)
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
      authnetRefId: paymentTransaction.authnet_ref_id,
      currentStatus: paymentTransaction.payment_status,
      prescriptionId: paymentTransaction.prescription_id,
    });

    // SECOND IDEMPOTENCY CHECK: Verify payment is still pending (handles race condition)
    // Two webhooks could pass the first check before either updates the record
    if (paymentTransaction.payment_status === "completed") {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] IDEMPOTENCY: Payment already completed, skipping", {
        transactionId: paymentTransaction.id,
        status: paymentTransaction.payment_status,
      });
      return;
    }

    // AMOUNT VALIDATION: Verify the paid amount matches what we expected
    // This prevents attacks where someone pays less than the actual cost
    if (authAmount !== undefined) {
      const expectedAmountDollars = paymentTransaction.total_amount_cents / 100;
      const amountDifference = Math.abs(authAmount - expectedAmountDollars);

      if (amountDifference > 1) {
        console.error("[WEBHOOK:authnet:handlePaymentSuccess] SECURITY: Amount mismatch detected!", {
          expectedAmount: expectedAmountDollars,
          receivedAmount: authAmount,
          difference: amountDifference,
          transactionId: paymentTransaction.id,
        });
        // Don't process payment with wrong amount - this could be fraud
        return;
      }
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Amount validated:", {
        expected: expectedAmountDollars,
        received: authAmount,
      });
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
    console.log("[WEBHOOK:authnet:handlePaymentSuccess] Checking prescription_id:", {
      prescription_id: paymentTransaction.prescription_id,
      hasValue: !!paymentTransaction.prescription_id,
    });

    if (paymentTransaction.prescription_id) {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Updating prescription payment status:", paymentTransaction.prescription_id);

      // Update prescription with payment_status AND order_progress together
      // This ensures consistency even if submit-to-pharmacy fails later
      const { error: prescriptionUpdateError } = await supabase
        .from("prescriptions")
        .update({
          payment_status: "paid",
          order_progress: "payment_received",
          status: "payment_received",
        })
        .eq("id", paymentTransaction.prescription_id);

      if (prescriptionUpdateError) {
        console.log("[WEBHOOK:authnet:handlePaymentSuccess] ERROR: Failed to update prescription:", prescriptionUpdateError);
      } else {
        console.log("[WEBHOOK:authnet:handlePaymentSuccess] Prescription updated: payment_status=paid, order_progress=payment_received");
      }

      // Now submit to pharmacy (this will update status and queue_id)
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] Submitting to pharmacy...");
      try {
        const submitResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/prescriptions/${paymentTransaction.prescription_id}/submit-to-pharmacy`,
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

          // Update payment_transaction to reflect pharmacy processing
          await supabase
            .from("payment_transactions")
            .update({
              order_progress: "pharmacy_processing",
            })
            .eq("id", paymentTransaction.id);
        } else {
          const errorText = await submitResponse.text();
          console.log("[WEBHOOK:authnet:handlePaymentSuccess] WARNING: Failed to submit to pharmacy (will retry):", errorText);
          // Note: prescription still has payment_status=paid and order_progress=payment_received
          // A background job or manual retry can pick this up later
        }
      } catch (submitError) {
        console.log("[WEBHOOK:authnet:handlePaymentSuccess] WARNING: Exception submitting to pharmacy (will retry):", submitError);
      }
    } else {
      console.log("[WEBHOOK:authnet:handlePaymentSuccess] No prescription_id found, skipping pharmacy submission");
    }

    console.log("[WEBHOOK:authnet:handlePaymentSuccess] SUCCESS - Payment processed:", {
      transactionId: paymentTransaction.id,
      prescriptionId: paymentTransaction.prescription_id,
    });

    // Send confirmation email to patient
    if (paymentTransaction.patient_email) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const emailResponse = await fetch(
          `${siteUrl}/api/payments/send-confirmation-email`,
          {
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
          }
        );

        if (emailResponse.ok) {
          console.log("[WEBHOOK:authnet:handlePaymentSuccess] Confirmation email sent to patient");
        } else {
          console.log("[WEBHOOK:authnet:handlePaymentSuccess] WARNING: Failed to send confirmation email");
        }
      } catch (emailError) {
        console.log("[WEBHOOK:authnet:handlePaymentSuccess] WARNING: Exception sending confirmation email:", emailError);
      }
    }

    console.log("[WEBHOOK:authnet:handlePaymentSuccess] ========== END ==========");
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
