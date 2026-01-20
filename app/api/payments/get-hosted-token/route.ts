import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { envConfig } from "@/core/config/envConfig";

/**
 * Authorize.Net API endpoints
 */
const AUTHNET_API_URLS = {
  sandbox: "https://apitest.authorize.net/xml/v1/request.api",
  production: "https://api.authorize.net/xml/v1/request.api",
} as const;

const AUTHNET_HOSTED_URLS = {
  sandbox: "https://test.authorize.net/payment/payment",
  production: "https://accept.authorize.net/payment/payment",
} as const;

/**
 * POST /api/payments/get-hosted-token
 * Get an Accept Hosted form token from Authorize.Net
 * This token is used to redirect the user to Authorize.Net's hosted payment page
 */
export async function POST(request: NextRequest) {
  console.log("[PAYMENT:get-hosted-token] ========== START ==========");

  try {
    const body = await request.json();
    const { paymentToken } = body;

    console.log("[PAYMENT:get-hosted-token] Received paymentToken:", paymentToken?.substring(0, 16) + "...");

    if (!paymentToken) {
      console.log("[PAYMENT:get-hosted-token] ERROR: Missing payment token");
      return NextResponse.json(
        { success: false, error: "Payment token is required" },
        { status: 400 }
      );
    }

    // Validate Authorize.Net credentials are configured
    console.log("[PAYMENT:get-hosted-token] Checking Authorize.Net credentials...", {
      hasLoginId: !!envConfig.AUTHNET_API_LOGIN_ID,
      hasTransactionKey: !!envConfig.AUTHNET_TRANSACTION_KEY,
      environment: envConfig.AUTHNET_ENVIRONMENT,
    });

    if (!envConfig.AUTHNET_API_LOGIN_ID || !envConfig.AUTHNET_TRANSACTION_KEY) {
      console.log("[PAYMENT:get-hosted-token] ERROR: Authorize.Net credentials not configured");
      return NextResponse.json(
        { success: false, error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    // Get payment transaction by token
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_token", paymentToken)
      .single();

    if (transactionError || !transaction) {
      console.log("[PAYMENT:get-hosted-token] ERROR: Payment transaction not found", {
        paymentToken: paymentToken?.substring(0, 16) + "...",
        error: transactionError,
      });
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    console.log("[PAYMENT:get-hosted-token] Transaction found:", {
      transactionId: transaction.id,
      status: transaction.payment_status,
      amount: transaction.total_amount_cents,
    });

    // Check if payment is already completed
    if (transaction.payment_status === "completed") {
      console.log("[PAYMENT:get-hosted-token] ERROR: Payment already completed");
      return NextResponse.json(
        { success: false, error: "Payment has already been completed" },
        { status: 400 }
      );
    }

    // Check if payment link has expired
    if (
      transaction.payment_link_expires_at &&
      new Date(transaction.payment_link_expires_at) < new Date()
    ) {
      console.log("[PAYMENT:get-hosted-token] ERROR: Payment link expired", {
        expiresAt: transaction.payment_link_expires_at,
        now: new Date().toISOString(),
      });
      return NextResponse.json(
        { success: false, error: "Payment link has expired" },
        { status: 400 }
      );
    }

    console.log("[PAYMENT:get-hosted-token] Payment status checks passed");

    // Calculate amount in dollars
    const totalAmountDollars = (transaction.total_amount_cents / 100).toFixed(2);

    // Build site URL for return URLs
    const siteUrl =
      envConfig.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";

    // Build the getHostedPaymentPageRequest
    const hostedPaymentRequest = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: {
          name: envConfig.AUTHNET_API_LOGIN_ID,
          transactionKey: envConfig.AUTHNET_TRANSACTION_KEY,
        },
        refId: transaction.id.substring(0, 20), // Use transaction ID (Authorize.Net limit is 20 chars)
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: totalAmountDollars,
          order: {
            invoiceNumber: transaction.id.substring(0, 20), // Authorize.Net limit is 20 chars
            description: transaction.description || "Prescription Payment",
          },
          customer: {
            email: transaction.patient_email || "",
          },
        },
        hostedPaymentSettings: {
          setting: [
            {
              settingName: "hostedPaymentReturnOptions",
              settingValue: JSON.stringify({
                showReceipt: false,
                url: `${siteUrl}/payment/success/${paymentToken}`,
                urlText: "Return to site",
                cancelUrl: `${siteUrl}/payment/cancelled/${paymentToken}`,
                cancelUrlText: "Cancel Payment",
              }),
            },
            {
              settingName: "hostedPaymentButtonOptions",
              settingValue: JSON.stringify({
                text: "Pay Now",
              }),
            },
            {
              settingName: "hostedPaymentOrderOptions",
              settingValue: JSON.stringify({
                show: true,
                merchantName: "AIMRX",
              }),
            },
            {
              settingName: "hostedPaymentBillingAddressOptions",
              settingValue: JSON.stringify({
                show: true,
                required: true,
              }),
            },
            {
              settingName: "hostedPaymentCustomerOptions",
              settingValue: JSON.stringify({
                showEmail: true,
                requiredEmail: true,
              }),
            },
            {
              settingName: "hostedPaymentStyleOptions",
              settingValue: JSON.stringify({
                bgColor: "white",
              }),
            },
            {
              settingName: "hostedPaymentPaymentOptions",
              settingValue: JSON.stringify({
                cardCodeRequired: true,
                showCreditCard: true,
                showBankAccount: false,
              }),
            },
            {
              settingName: "hostedPaymentSecurityOptions",
              settingValue: JSON.stringify({
                captcha: false,
              }),
            },
          ],
        },
      },
    };

    // Determine API URL based on environment
    const apiUrl = AUTHNET_API_URLS[envConfig.AUTHNET_ENVIRONMENT];
    const hostedUrl = AUTHNET_HOSTED_URLS[envConfig.AUTHNET_ENVIRONMENT];

    console.log("[PAYMENT:get-hosted-token] Calling Authorize.Net API:", {
      apiUrl,
      hostedUrl,
      environment: envConfig.AUTHNET_ENVIRONMENT,
      amount: totalAmountDollars,
      refId: paymentToken,
    });

    // Call Authorize.Net API
    const authnetResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hostedPaymentRequest),
    });

    const authnetData = await authnetResponse.json();

    console.log("[PAYMENT:get-hosted-token] Authorize.Net response:", {
      resultCode: authnetData.messages?.resultCode,
      hasToken: !!authnetData.token,
      messages: authnetData.messages?.message,
    });

    // Check for API errors
    if (
      authnetData.messages?.resultCode !== "Ok" ||
      !authnetData.token
    ) {
      const errorMessage =
        authnetData.messages?.message?.[0]?.text ||
        "Failed to get hosted payment token";
      console.log("[PAYMENT:get-hosted-token] ERROR: Authorize.Net API error:", {
        resultCode: authnetData.messages?.resultCode,
        error: errorMessage,
        fullResponse: authnetData,
      });
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Update transaction to mark that hosted token was requested
    await supabase
      .from("payment_transactions")
      .update({
        payment_link_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    console.log("[PAYMENT:get-hosted-token] SUCCESS - Returning hosted token:", {
      paymentUrl: hostedUrl,
      tokenLength: authnetData.token?.length,
    });
    console.log("[PAYMENT:get-hosted-token] ========== END ==========");

    return NextResponse.json({
      success: true,
      formToken: authnetData.token,
      paymentUrl: hostedUrl,
    });
  } catch (error) {
    console.log("[PAYMENT:get-hosted-token] FATAL ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize payment",
      },
      { status: 500 }
    );
  }
}
