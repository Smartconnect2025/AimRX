import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/features/stripe/services/stripeService";
import { stripeCustomerDbServiceServer } from "@/features/stripe/services/stripeCustomerService";
import { stripeOrderDbServiceServer } from "@/features/stripe/services/stripeOrderService";
import { addressHelperService } from "@/features/stripe/services/addressHelperService";
import { envConfig } from "@/core/config/envConfig";
import { createClient } from "@core/supabase";

interface StripeSubscriptionWithDates
  extends Omit<Stripe.Subscription, "canceled_at"> {
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number | null;
}

interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription: string;
}

const endpointSecret = envConfig.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!endpointSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

/**
 * Handle checkout session completed event
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  console.log("Processing checkout.session.completed:", session.id);

  try {
    const supabase = createClient();

    // Check for duplicate order first
    const orderExists = await stripeOrderDbServiceServer.orderExistsBySessionId(
      session.id,
    );
    if (orderExists) {
      console.log("Order already exists for session:", session.id);
      return;
    }

    // Get customer information
    const customerId = session.customer as string;
    if (!customerId) {
      console.error("No customer ID in session:", session.id);
      return;
    }

    // Find user by Stripe customer ID
    let customerResult =
      await stripeCustomerDbServiceServer.getStripeCustomerByStripeId(
        customerId,
      );

    // If not found by Stripe ID, try to find by user ID from metadata
    if (!customerResult.success || !customerResult.data) {
      const userIdFromMetadata = session.metadata?.user_id;
      if (userIdFromMetadata) {
        customerResult =
          await stripeCustomerDbServiceServer.getStripeCustomerByUserId(
            userIdFromMetadata,
          );
      }
    }

    if (!customerResult.success || !customerResult.data) {
      console.error("Customer not found in database:", customerId);
      return;
    }

    const userId = customerResult.data.user_id;

    // Get subscription ID if this is a subscription checkout
    let subscriptionId: string | null = null;
    if (session.subscription) {
      subscriptionId = session.subscription as string;
    }

    // Get the session with expanded line items for detailed order information
    const detailedSession = await stripe.checkout.sessions.retrieve(
      session.id,
      {
        expand: ["line_items", "line_items.data.price.product"],
      },
    );

    // Get or create placeholder address for the user
    const addressResult =
      await addressHelperService.getOrCreatePlaceholderAddress(userId);
    if (!addressResult.success) {
      console.error("Failed to get/create address:", addressResult.error);
      return;
    }

    // Calculate discount information
    const discountAmount = detailedSession.total_details?.amount_discount || 0;
    const subtotalAmount = (detailedSession.amount_total || 0) + discountAmount;

    // Create order record with detailed session and subscription data
    const orderData = {
      user_id: userId,
      shipping_address_id: addressResult.addressId!,
      billing_address_id: null,
      payment_details: {
        stripe_session_id: session.id,
        stripe_customer_id: customerId,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        amount_subtotal: subtotalAmount,
        amount_discount: discountAmount,
        currency: session.currency,
        payment_method_types: JSON.stringify(session.payment_method_types),
        billing_frequency: subscriptionId ? "monthly" : null, // We can enhance this later
      },
      status: session.payment_status === "paid" ? "completed" : "pending",
      stripe_session_id: session.id,
      stripe_subscription_id: subscriptionId,
    };

    // Determine activity message based on payment status
    const activityMessage =
      session.payment_status === "paid" ? "Order Completed" : "Order Placed";

    const orderResult =
      await stripeOrderDbServiceServer.createOrderWithActivity(
        orderData,
        activityMessage,
      );
    if (!orderResult.success) {
      console.error("Failed to create order:", orderResult.error);
      return;
    }

    // Create line items for the order
    const lineItems = detailedSession.line_items?.data || [];
    if (lineItems.length > 0) {
      // Get all products from our database that match the Stripe product IDs
      const stripeProductIds = lineItems
        .map((item) => {
          const product = item.price?.product;
          return typeof product === "string" ? product : product?.id;
        })
        .filter(Boolean);

      const { data: dbProducts } = await supabase
        .from("products")
        .select("id, name, stripe_product_id")
        .in("stripe_product_id", stripeProductIds);

      // Create a map for quick lookup
      type DbProduct = {
        id: number;
        name: string;
        stripe_product_id: string;
      };

      const productMap = new Map<string, DbProduct>(
        (dbProducts as DbProduct[])?.map((p) => [p.stripe_product_id, p]) || [],
      );

      type OrderLineItem = {
        order_id: string;
        product_id: number;
        name: string;
        image_url: string | null;
        quantity: number;
        price: number;
        subscription_price: number;
        stripe_price_id: string | null;
      };

      const orderLineItems = lineItems
        .map((item) => {
          const stripeProduct = item.price?.product;
          const stripeProductId =
            typeof stripeProduct === "string"
              ? stripeProduct
              : stripeProduct?.id;

          // Find our product by Stripe product ID
          const dbProduct = stripeProductId
            ? productMap.get(stripeProductId)
            : null;

          if (!dbProduct) {
            console.error(
              `Product not found for Stripe product ID: ${stripeProductId}`,
            );
            return null;
          }

          const lineItem: OrderLineItem = {
            order_id: orderResult.data!.id,
            product_id: dbProduct.id,
            name: dbProduct.name,
            image_url: null,
            quantity: item.quantity || 1,
            price: item.amount_total || 0,
            subscription_price: item.amount_total || 0,
            stripe_price_id: item.price?.id || null,
          };
          return lineItem;
        })
        .filter((item): item is OrderLineItem => item !== null);

      const lineItemResult =
        await stripeOrderDbServiceServer.createOrderLineItems(orderLineItems);
      if (!lineItemResult.success) {
        console.error(
          "Failed to create order line items:",
          lineItemResult.error,
        );
      } else {
        console.log("Order line items created successfully");
      }
    }

    console.log("Order created successfully:", orderResult.data?.id);
  } catch (error) {
    console.error("Error processing checkout session completed:", error);
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Processing customer.subscription.created:", subscription.id);

  try {
    // Update order with subscription details if it exists
    const orderResult =
      await stripeOrderDbServiceServer.getOrderByStripeSubscriptionId(
        subscription.id,
      );
    if (orderResult.success && orderResult.data) {
      const newStatus = subscription.status === "active" ? "active" : "pending";
      const activityMessage =
        subscription.status === "active"
          ? "Subscription Activated"
          : "Subscription Created";

      await stripeOrderDbServiceServer.updateOrderStatusWithActivity(
        orderResult.data.id,
        newStatus,
        {
          stripe_subscription_id: subscription.id,
          payment_details: {
            ...orderResult.data.payment_details,
            subscription_status: subscription.status,
            current_period_start: (subscription as StripeSubscriptionWithDates)
              .current_period_start,
            current_period_end: (subscription as StripeSubscriptionWithDates)
              .current_period_end,
          },
        },
      );

      // Create specific activity for subscription creation
      await stripeOrderDbServiceServer.createOrderActivity({
        order_id: orderResult.data.id,
        status: activityMessage,
      });
    }
  } catch (error) {
    console.error("Error processing subscription created:", error);
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Processing customer.subscription.updated:", subscription.id);

  try {
    // Update order with new subscription status
    const orderResult =
      await stripeOrderDbServiceServer.getOrderByStripeSubscriptionId(
        subscription.id,
      );
    if (orderResult.success && orderResult.data) {
      const newStatus =
        subscription.status === "active" ? "active" : subscription.status;

      // Determine activity message based on subscription changes
      let activityMessage = "Subscription Updated";
      if (subscription.status === "canceled") {
        activityMessage = "Subscription Canceled";
      } else if (subscription.status === "active") {
        activityMessage = "Subscription Reactivated";
      } else if (subscription.status === "past_due") {
        activityMessage = "Subscription Past Due";
      } else if (
        (subscription as StripeSubscriptionWithDates).cancel_at_period_end
      ) {
        activityMessage = "Subscription Scheduled for Cancellation";
      }

      await stripeOrderDbServiceServer.updateOrderStatusWithActivity(
        orderResult.data.id,
        newStatus,
        {
          payment_details: {
            ...orderResult.data.payment_details,
            subscription_status: subscription.status,
            current_period_start: (subscription as StripeSubscriptionWithDates)
              .current_period_start,
            current_period_end: (subscription as StripeSubscriptionWithDates)
              .current_period_end,
            cancel_at_period_end: (subscription as StripeSubscriptionWithDates)
              .cancel_at_period_end,
          },
        },
      );

      // Create specific activity for subscription update
      await stripeOrderDbServiceServer.createOrderActivity({
        order_id: orderResult.data.id,
        status: activityMessage,
      });
    }
  } catch (error) {
    console.error("Error processing subscription updated:", error);
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing customer.subscription.deleted:", subscription.id);

  try {
    // Update order status to cancelled
    const orderResult =
      await stripeOrderDbServiceServer.getOrderByStripeSubscriptionId(
        subscription.id,
      );
    if (orderResult.success && orderResult.data) {
      await stripeOrderDbServiceServer.updateOrderStatusWithActivity(
        orderResult.data.id,
        "cancelled",
        {
          payment_details: {
            ...orderResult.data.payment_details,
            subscription_status: "canceled",
            canceled_at:
              (subscription as StripeSubscriptionWithDates).canceled_at || null,
          },
        },
      );

      // Create specific activity for subscription deletion
      await stripeOrderDbServiceServer.createOrderActivity({
        order_id: orderResult.data.id,
        status: "Subscription Terminated",
      });
    }
  } catch (error) {
    console.error("Error processing subscription deleted:", error);
  }
}

/**
 * Handle invoice payment succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_succeeded:", invoice.id);

  try {
    if ((invoice as StripeInvoiceWithSubscription).subscription) {
      // Update order with successful payment info
      const orderResult =
        await stripeOrderDbServiceServer.getOrderByStripeSubscriptionId(
          (invoice as StripeInvoiceWithSubscription).subscription,
        );
      if (orderResult.success && orderResult.data) {
        await stripeOrderDbServiceServer.updateOrderStripeData(
          orderResult.data.id,
          {
            payment_details: {
              ...orderResult.data.payment_details,
              last_payment_date: new Date(invoice.created * 1000).toISOString(),
              last_payment_amount: invoice.amount_paid,
              last_invoice_id: invoice.id || null,
            },
          },
        );

        // Create activity for successful payment
        const paymentAmount = (invoice.amount_paid || 0) / 100; // Convert from cents
        await stripeOrderDbServiceServer.createOrderActivity({
          order_id: orderResult.data.id,
          status: `Payment Received ($${paymentAmount.toFixed(2)})`,
        });
      }
    }
  } catch (error) {
    console.error("Error processing invoice payment succeeded:", error);
  }
}

/**
 * Handle invoice payment failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_failed:", invoice.id);

  try {
    if ((invoice as StripeInvoiceWithSubscription).subscription) {
      // Update order with failed payment info
      const orderResult =
        await stripeOrderDbServiceServer.getOrderByStripeSubscriptionId(
          (invoice as StripeInvoiceWithSubscription).subscription,
        );
      if (orderResult.success && orderResult.data) {
        await stripeOrderDbServiceServer.updateOrderStatusWithActivity(
          orderResult.data.id,
          "payment_failed",
          {
            payment_details: {
              ...orderResult.data.payment_details,
              last_payment_failed_date: new Date(
                invoice.created * 1000,
              ).toISOString(),
              last_failed_invoice_id: invoice.id || null,
            },
          },
        );

        // Create activity for failed payment
        const attemptedAmount = (invoice.amount_due || 0) / 100; // Convert from cents
        await stripeOrderDbServiceServer.createOrderActivity({
          order_id: orderResult.data.id,
          status: `Payment Failed ($${attemptedAmount.toFixed(2)})`,
        });
      }
    }
  } catch (error) {
    console.error("Error processing invoice payment failed:", error);
  }
}
