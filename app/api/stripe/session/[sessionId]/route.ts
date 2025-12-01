import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUser } from "@/core/auth/get-user";
import { getCheckoutSession } from "@/features/stripe/services/stripeService";
import { stripeOrderDbServiceServer } from "@/features/stripe/services/stripeOrderService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    // Get authenticated user
    const { user } = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 },
      );
    }

    // Retrieve the checkout session from Stripe with expanded line items
    const session = await getCheckoutSession(sessionId);

    // Verify the session belongs to the current user
    if (session.customer !== user.id && session.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Session does not belong to current user" },
        { status: 403 },
      );
    }

    // Check if order already exists to prevent duplicates
    const existingOrder =
      await stripeOrderDbServiceServer.getOrderByStripeSessionId(sessionId);

    // Calculate discount amount
    const discountAmount = session.total_details?.amount_discount || 0;
    const subtotalAmount = (session.amount_total || 0) + discountAmount;

    // Process line items
    const lineItems =
      session.line_items?.data?.map((item) => ({
        id: item.id,
        price_id: item.price?.id,
        product_id:
          typeof item.price?.product === "string"
            ? item.price.product
            : item.price?.product?.id,
        product_name:
          typeof item.price?.product === "string"
            ? item.description
            : (item.price?.product as Stripe.Product)?.name || item.description,
        quantity: item.quantity,
        amount_total: item.amount_total,
        amount_subtotal: item.amount_subtotal,
        currency: item.currency,
      })) || [];

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        amount_total: session.amount_total,
        amount_subtotal: subtotalAmount,
        amount_discount: discountAmount,
        currency: session.currency,
        customer: session.customer,
        subscription: session.subscription,
        metadata: session.metadata,
        line_items: lineItems,
        billing_frequency: session.subscription ? "monthly" : null, // We'll enhance this later
      },
      order: {
        exists: existingOrder.success,
        order_id: existingOrder.data?.id || null,
      },
    });
  } catch (error) {
    console.error("Error retrieving session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
