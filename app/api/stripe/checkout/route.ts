import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/core/auth/get-user";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
} from "@/features/stripe/services/stripeService";
import { stripeCustomerDbServiceServer } from "@/features/stripe/services/stripeCustomerService";
import { envConfig } from "@/core/config/envConfig";
import type { StripeCartItem } from "@/features/stripe/types";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { user } = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { items }: { items: StripeCartItem[] } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart items are required" },
        { status: 400 },
      );
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.price || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid cart item: price and quantity are required",
          },
          { status: 400 },
        );
      }
    }

    // First check if we have a customer in our database
    const existingCustomer =
      await stripeCustomerDbServiceServer.getStripeCustomerByUserId(user.id);

    // Get or create Stripe customer, passing existing ID if we have one
    const stripeCustomer = await getOrCreateStripeCustomer(
      user.id,
      user.email || "",
      user.email?.split("@")[0] || "Customer",
      existingCustomer.success
        ? existingCustomer.data?.stripe_customer_id
        : undefined,
    );
    if (!existingCustomer.success || !existingCustomer.data) {
      const storeResult =
        await stripeCustomerDbServiceServer.storeStripeCustomer({
          user_id: user.id,
          stripe_customer_id: stripeCustomer.id,
          stripe_metadata: {
            email: user.email || "",
            created_via: "checkout_session",
          },
        });

      if (!storeResult.success) {
        console.error(
          "Failed to store customer in database:",
          storeResult.error,
        );
        return NextResponse.json(
          { success: false, error: "Failed to create customer record" },
          { status: 500 },
        );
      }
    }

    // The createCheckoutSession function will determine the mode based on price types

    // Create checkout session
    const session = await createCheckoutSession({
      items,
      customer_id: stripeCustomer.id,
      success_url: `${envConfig.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${envConfig.NEXT_PUBLIC_APP_URL}/catalog`,
      metadata: {
        user_id: user.id,
        cart_items_count: items.length.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: unknown) {
    console.error("Error creating Stripe checkout session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
