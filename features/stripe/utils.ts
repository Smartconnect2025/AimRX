import type { SubscriptionInterval, PriceDisplayInfo } from "./types";
import type Stripe from "stripe";

// Stripe price interval mapping
export const STRIPE_INTERVAL_MAP: Record<SubscriptionInterval, string> = {
  month: "month",
  quarter: "3 months",
  year: "year",
};

/**
 * Helper function to format price for display
 */
export const formatStripePrice = (
  amount: number,
  interval?: SubscriptionInterval,
): string => {
  const formattedAmount = (amount / 100).toFixed(2);

  if (interval) {
    const intervalDisplay = STRIPE_INTERVAL_MAP[interval] || interval;
    return `$${formattedAmount}/${intervalDisplay}`;
  }

  return `$${formattedAmount}`;
};

/**
 * Get subscription interval from Stripe price
 */
export const getSubscriptionInterval = (
  stripePrice: Stripe.Price,
): SubscriptionInterval | null => {
  if (stripePrice.type !== "recurring") {
    return null;
  }

  const interval = stripePrice.recurring?.interval;
  const intervalCount = stripePrice.recurring?.interval_count || 1;

  // Handle quarterly (3 months) and annual (12 months) intervals
  if (interval === "month" && intervalCount === 3) {
    return "quarter";
  }

  switch (interval) {
    case "month":
      return "month";
    case "year":
      return "year";
    default:
      return null;
  }
};

/**
 * Get price display information from Stripe price
 */
export const getPriceDisplayInfo = (
  stripePrice: Stripe.Price,
): PriceDisplayInfo => {
  const amount = stripePrice.unit_amount || 0;
  const interval = getSubscriptionInterval(stripePrice);
  const isSubscription = stripePrice.type === "recurring";

  return {
    amount,
    formatted: formatStripePrice(amount, interval || undefined),
    interval: interval || undefined,
    isSubscription,
  };
};

/**
 * Get the lowest price from a list of prices (for display in product grid)
 * Prioritizes monthly prices, then sorts by amount
 */
export const getLowestPrice = (prices: Stripe.Price[]): Stripe.Price | null => {
  if (prices.length === 0) return null;

  // Filter out inactive prices
  const activePrices = prices.filter((price) => price.active);
  if (activePrices.length === 0) return null;

  // Prioritize monthly prices for grid display
  const monthlyPrices = activePrices.filter((price) => {
    if (price.type !== "recurring") return false;
    const interval = price.recurring?.interval;
    const intervalCount = price.recurring?.interval_count || 1;
    return interval === "month" && intervalCount === 1;
  });

  // If we have monthly prices, return the lowest one
  if (monthlyPrices.length > 0) {
    return monthlyPrices.sort(
      (a, b) => (a.unit_amount || 0) - (b.unit_amount || 0),
    )[0];
  }

  // Otherwise, return the lowest price overall
  return activePrices.sort(
    (a, b) => (a.unit_amount || 0) - (b.unit_amount || 0),
  )[0];
};

// Removed unused functions to reduce bundle size
// These can be added back when needed for cart validation
