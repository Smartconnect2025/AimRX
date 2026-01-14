import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { decryptAuthNetKey } from "@/core/services/encryption/authnet-encryption";

/**
 * POST /api/payments/process-payment
 * Process payment directly using Authorize.Net API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentToken,
      cardNumber,
      expirationDate, // Format: MMYY
      cvv,
      cardholderName,
      billingAddress,
    } = body;

    if (!paymentToken || !cardNumber || !expirationDate || !cvv) {
      return NextResponse.json(
        { error: "Missing required payment information" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get payment transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_token", paymentToken)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if already paid
    if (transaction.payment_status === "completed") {
      return NextResponse.json({ error: "Payment already completed" }, { status: 400 });
    }

    // Check if expired
    if (new Date(transaction.payment_link_expires_at) < new Date()) {
      return NextResponse.json({ error: "Payment link has expired" }, { status: 400 });
    }

    // Get payment credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from("payment_credentials")
      .select("*")
      .eq("is_active", true)
      .single();

    if (credentialsError || !credentials) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // Decrypt transaction key
    let transactionKey: string;
    try {
      transactionKey = decryptAuthNetKey(credentials.transaction_key_encrypted);
    } catch (error) {
      console.error("Failed to decrypt transaction key:", error);
      return NextResponse.json(
        { error: "Payment configuration error" },
        { status: 500 }
      );
    }

    const authnetApiUrl =
      credentials.environment === "live"
        ? "https://api.authorize.net/xml/v1/request.api"
        : "https://apitest.authorize.net/xml/v1/request.api";

    const amount = (transaction.total_amount_cents / 100).toFixed(2);

    // Build payment request
    const paymentRequest = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: credentials.api_login_id,
          transactionKey: transactionKey,
        },
        refId: transaction.id,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount,
          payment: {
            creditCard: {
              cardNumber: cardNumber.replace(/\s/g, ""),
              expirationDate: expirationDate,
              cardCode: cvv,
            },
          },
          order: {
            invoiceNumber: transaction.id.substring(0, 20), // Limit to 20 chars
            description: transaction.description,
          },
          customer: {
            email: transaction.patient_email,
          },
          billTo: billingAddress ? {
            firstName: billingAddress.firstName || cardholderName?.split(" ")[0] || "",
            lastName: billingAddress.lastName || cardholderName?.split(" ").slice(1).join(" ") || "",
            address: billingAddress.address || "",
            city: billingAddress.city || "",
            state: billingAddress.state || "",
            zip: billingAddress.zip || "",
            country: billingAddress.country || "US",
          } : {
            firstName: cardholderName?.split(" ")[0] || "",
            lastName: cardholderName?.split(" ").slice(1).join(" ") || "",
            zip: billingAddress?.zip || "",
          },
        },
      },
    };

    console.log("Processing payment for transaction:", transaction.id);

    // Call Authorize.Net API
    const authnetResponse = await fetch(authnetApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentRequest),
    });

    const authnetData = await authnetResponse.json();

    console.log("Authorize.Net payment response:", authnetData);

    // Check if payment was successful
    if (authnetData.messages?.resultCode === "Ok" && authnetData.transactionResponse?.responseCode === "1") {
      // Payment successful
      const transactionId = authnetData.transactionResponse.transId;

      // Update payment transaction
      await supabase
        .from("payment_transactions")
        .update({
          payment_status: "completed",
          payment_method: "credit_card",
          authnet_transaction_id: transactionId,
          paid_at: new Date().toISOString(),
          order_progress: "payment_received",
        })
        .eq("id", transaction.id);

      // Update prescription
      await supabase
        .from("prescriptions")
        .update({
          payment_status: "paid",
        })
        .eq("id", transaction.prescription_id);

      console.log("✅ Payment successful:", transactionId);

      return NextResponse.json({
        success: true,
        transactionId,
        amount: amount,
      });
    } else {
      // Payment failed
      const errorCode = authnetData.transactionResponse?.errors?.[0]?.errorCode;
      const errorMessage = authnetData.transactionResponse?.errors?.[0]?.errorText ||
        authnetData.messages?.message?.[0]?.text ||
        "Payment declined";

      console.error("Payment failed:", errorMessage);

      // Update transaction as failed
      await supabase
        .from("payment_transactions")
        .update({
          payment_status: "failed",
          error_message: errorMessage,
        })
        .eq("id", transaction.id);

      return NextResponse.json({
        success: false,
        error: errorMessage,
        errorCode: errorCode,
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process payment",
      },
      { status: 500 }
    );
  }
}
