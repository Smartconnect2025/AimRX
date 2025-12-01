import Stripe from "stripe";
import { envConfig } from "@/core/config/envConfig";
import type {
  CreateCheckoutSessionParams,
  StripeProductWithPrices,
  StripeCustomerInfo,
} from "../types";

// Server-side Stripe instance
export const stripe = new Stripe(envConfig.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(
  customerInfo: StripeCustomerInfo,
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email: customerInfo.email,
    name: customerInfo.name,
    metadata: customerInfo.metadata,
  });
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string,
  existingStripeCustomerId?: string,
): Promise<Stripe.Customer> {
  // First, try to use existing Stripe customer ID if provided
  if (existingStripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(
        existingStripeCustomerId,
      );
      if (!existingCustomer.deleted) {
        // Update metadata to ensure user_id is present
        if (!existingCustomer.metadata?.user_id) {
          await stripe.customers.update(existingStripeCustomerId, {
            metadata: {
              ...existingCustomer.metadata,
              user_id: userId,
            },
          });
        }
        return existingCustomer as Stripe.Customer;
      }
    } catch (error) {
      console.error(
        `Failed to retrieve customer ${existingStripeCustomerId}:`,
        error,
      );
      // Continue to next lookup method if customer not found
    }
  }

  // Then, try to find existing customer by user_id in metadata
  // Search with pagination to handle large customer bases
  let startingAfter: string | undefined;
  let customerWithUserId: Stripe.Customer | undefined;

  while (!customerWithUserId) {
    const existingByMetadata = await stripe.customers.list({
      limit: 100,
      starting_after: startingAfter,
    });

    customerWithUserId = existingByMetadata.data.find(
      (customer) => customer.metadata?.user_id === userId,
    );

    // If no more customers to check, break
    if (!existingByMetadata.has_more || existingByMetadata.data.length === 0) {
      break;
    }

    // Set up for next iteration
    startingAfter =
      existingByMetadata.data[existingByMetadata.data.length - 1].id;
  }

  if (customerWithUserId) {
    return customerWithUserId;
  }

  // Finally, try to find by email
  const existingByEmail = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingByEmail.data.length > 0) {
    const customer = existingByEmail.data[0];
    // Update metadata to include our user ID
    await stripe.customers.update(customer.id, {
      metadata: {
        ...customer.metadata,
        user_id: userId,
      },
    });
    return customer;
  }

  // Create new customer only if no existing customer found
  return await createStripeCustomer({
    email,
    name,
    metadata: { user_id: userId },
  });
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession({
  items,
  customer_id,
  success_url,
  cancel_url,
  metadata = {},
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  // Determine if this is a subscription or one-time payment
  // We need to fetch price details to determine if they're recurring
  const priceIds = items.map((item) => item.price);
  const prices = await Promise.all(
    priceIds.map((priceId) => stripe.prices.retrieve(priceId)),
  );

  const hasSubscriptions = prices.some((price) => price.type === "recurring");

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customer_id,
    line_items: items,
    mode: hasSubscriptions ? "subscription" : "payment",
    success_url,
    cancel_url,
    allow_promotion_codes: true,
    billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    metadata,
    payment_method_types: ["card"],
  };

  return await stripe.checkout.sessions.create(sessionParams);
}

/**
 * Retrieve a Stripe checkout session
 */
export async function getCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "line_items.data.price.product"],
  });
}

/**
 * Get Stripe product with all its prices
 */
export async function getStripeProductWithPrices(
  productId: string,
): Promise<StripeProductWithPrices | null> {
  try {
    const product = await stripe.products.retrieve(productId);
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    return {
      ...product,
      prices: prices.data,
    };
  } catch (error) {
    console.error("Error fetching Stripe product:", error);
    return null;
  }
}

/**
 * Check if a customer has any active subscriptions
 */
export async function customerHasActiveSubscriptions(
  customerId: string,
): Promise<boolean> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    return subscriptions.data.length > 0;
  } catch (error) {
    console.error("Error checking customer subscriptions:", error);
    return false;
  }
}
