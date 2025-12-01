import { getStripeProductWithPrices } from "@/features/stripe/services/stripeService";
import { processStripePrices } from "@/features/stripe/utils/price-processing";
import type { StripePriceInfo } from "../types";

interface StripePricingSummary {
  prices: StripePriceInfo[];
  lowestPrice: StripePriceInfo | null;
}

interface StripePricingResult extends StripePricingSummary {
  found: boolean;
}

async function fetchPricingSummary(
  stripeProductId: string,
): Promise<StripePricingResult> {
  const stripeProduct = await getStripeProductWithPrices(stripeProductId);

  if (!stripeProduct) {
    return {
      found: false,
      prices: [],
      lowestPrice: null,
    };
  }

  const { prices, lowestPrice } = processStripePrices(stripeProduct);

  return {
    found: true,
    prices,
    lowestPrice,
  };
}

async function processInBatches<T>(
  ids: string[],
  handler: (id: string) => Promise<T>,
  batchSize = 5,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((id) => handler(id)));
    results.push(...batchResults);
  }

  return results;
}

export const stripePriceServiceServer = {
  /**
   * Fetch full pricing summary for a Stripe product (prices + lowest price)
   */
  async getProductPricing(
    stripeProductId: string,
  ): Promise<StripePricingResult> {
    return fetchPricingSummary(stripeProductId);
  },

  /**
   * Fetch only the price list for a Stripe product
   */
  async getProductPrices(stripeProductId: string): Promise<StripePriceInfo[]> {
    const { prices } = await fetchPricingSummary(stripeProductId);
    return prices;
  },

  /**
   * Fetch pricing summaries for multiple Stripe products
   */
  async getBatchProductPricing(
    stripeProductIds: string[],
  ): Promise<Record<string, StripePricingResult>> {
    const results: Record<string, StripePricingResult> = {};

    if (stripeProductIds.length === 0) {
      return results;
    }

    const summaries = await processInBatches(stripeProductIds, (id) =>
      fetchPricingSummary(id).then((summary) => ({
        id,
        summary,
      })),
    );

    summaries.forEach(({ id, summary }) => {
      results[id] = summary;
    });

    return results;
  },

  /**
   * Fetch price lists for multiple Stripe products
   */
  async getBatchProductPrices(
    stripeProductIds: string[],
  ): Promise<Record<string, StripePriceInfo[]>> {
    const summaries =
      await stripePriceServiceServer.getBatchProductPricing(stripeProductIds);

    return Object.fromEntries(
      stripeProductIds.map((id) => [id, summaries[id]?.prices || []]),
    );
  },

  /**
   * Fetch lowest price for multiple Stripe products
   */
  async getBatchLowestPrices(
    stripeProductIds: string[],
  ): Promise<Record<string, StripePriceInfo | null>> {
    const summaries =
      await stripePriceServiceServer.getBatchProductPricing(stripeProductIds);

    return Object.fromEntries(
      stripeProductIds.map((id) => [id, summaries[id]?.lowestPrice || null]),
    );
  },
};
