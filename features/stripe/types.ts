import type Stripe from "stripe";

// Extended Stripe types for our application
export interface StripeProductWithPrices extends Stripe.Product {
  prices: Stripe.Price[];
}

// Cart item interface for Stripe checkout
export interface StripeCartItem {
  price: string; // Changed from price_id to price
  quantity: number;
  adjustable_quantity?: {
    enabled: boolean;
    minimum?: number;
    maximum?: number;
  };
}

// Checkout session creation parameters
export interface CreateCheckoutSessionParams {
  items: StripeCartItem[];
  customer_id?: string;
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, string>;
}

// Subscription management types
export interface SubscriptionStatus {
  id: string;
  status: Stripe.Subscription.Status;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
}

// Webhook event types we'll handle
export type StripeWebhookEventType =
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "checkout.session.completed"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed";

// Webhook event handler type
export type WebhookEventHandler<T = unknown> = (
  event: Stripe.Event,
  data: T,
) => Promise<void>;

// Subscription interval types
export type SubscriptionInterval = "month" | "quarter" | "year";

// Price display information
export interface PriceDisplayInfo {
  amount: number;
  formatted: string;
  interval?: SubscriptionInterval;
  isSubscription: boolean;
}

// Customer information for Stripe
export interface StripeCustomerInfo {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}
