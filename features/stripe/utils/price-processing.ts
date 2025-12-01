import type Stripe from "stripe";
import { getPriceDisplayInfo, getLowestPrice } from "../utils";

/**
 * Process Stripe prices for API responses
 * Shared utility to avoid duplication between API routes
 */
export function processStripePrices(
  stripeProduct: Stripe.Product & { prices: Stripe.Price[] },
) {
  const prices = stripeProduct.prices.map((price) => {
    const priceInfo = getPriceDisplayInfo(price);
    return {
      id: price.id,
      amount: priceInfo.amount,
      formatted: priceInfo.formatted,
      interval: priceInfo.interval,
      isSubscription: priceInfo.isSubscription,
    };
  });

  // Sort prices to ensure lowest price is first (for grid display)
  // Prioritize monthly prices, then sort by amount
  prices.sort((a, b) => {
    // If both are subscriptions, prioritize monthly
    if (a.isSubscription && b.isSubscription) {
      if (a.interval === "month" && b.interval !== "month") return -1;
      if (b.interval === "month" && a.interval !== "month") return 1;
    }

    // If one is subscription and one is not, prioritize subscription
    if (a.isSubscription && !b.isSubscription) return -1;
    if (b.isSubscription && !a.isSubscription) return 1;

    // Otherwise sort by amount
    return a.amount - b.amount;
  });

  // Use the proper getLowestPrice function to prioritize monthly prices
  const lowestStripePrice = getLowestPrice(stripeProduct.prices);
  const lowestPrice = lowestStripePrice
    ? {
        id: lowestStripePrice.id,
        amount: getPriceDisplayInfo(lowestStripePrice).amount,
        formatted: getPriceDisplayInfo(lowestStripePrice).formatted,
        interval: getPriceDisplayInfo(lowestStripePrice).interval,
        isSubscription: getPriceDisplayInfo(lowestStripePrice).isSubscription,
      }
    : null;

  return { prices, lowestPrice };
}
