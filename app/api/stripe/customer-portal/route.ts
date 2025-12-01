import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/core/auth/get-user";
import { stripe } from "@/features/stripe/services/stripeService";
import { stripeCustomerDbServiceServer } from "@/features/stripe/services/stripeCustomerService";
import { envConfig } from "@/core/config/envConfig";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authResult = await getUser();
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get the return URL from the request body or use default
    const body = await request.json();
    const returnUrl =
      body.return_url || `${envConfig.NEXT_PUBLIC_APP_URL}/profile`;

    // Find the user's Stripe customer ID
    const customerResult =
      await stripeCustomerDbServiceServer.getStripeCustomerByUserId(
        authResult.user.id,
      );

    if (!customerResult.success || !customerResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "No Stripe customer found. Please make a purchase first.",
        },
        { status: 404 },
      );
    }

    // Create the customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerResult.data.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({
      success: true,
      portal_url: portalSession.url,
    });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create portal session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
