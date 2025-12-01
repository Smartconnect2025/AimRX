import type { StripePriceInfo } from "../types";

/**
 * Get the base URL for API requests
 * Handles both client-side and server-side calls
 */
function getApiBaseUrl(): string {
  // Check if we're on the client side
  if (typeof window !== "undefined") {
    return ""; // Use relative URLs on client side
  }

  // Server-side: construct absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return baseUrl;
}

/**
 * Service for fetching and managing Stripe prices for products
 * Uses API routes to avoid exposing Stripe secret key on client side
 */
export const stripePriceApiService = {
  /**
   * Fetch Stripe prices for a product
   */
  async getProductPrices(stripeProductId: string): Promise<StripePriceInfo[]> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/stripe/products/${stripeProductId}/prices`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch prices");
      }

      return data.data.prices || [];
    } catch (error) {
      console.error("Error fetching Stripe prices:", error);
      return [];
    }
  },

  /**
   * Get the lowest price for a product (for grid display)
   * Optimized to reuse the same API call as getProductPrices
   */
  async getLowestProductPrice(
    stripeProductId: string,
  ): Promise<StripePriceInfo | null> {
    try {
      const prices =
        await stripePriceApiService.getProductPrices(stripeProductId);
      return prices.length > 0 ? prices[0] : null; // First price is already the lowest
    } catch (error) {
      console.error("Error fetching lowest price:", error);
      return null;
    }
  },

  /**
   * Fetch prices for multiple products in batch
   */
  async getBatchProductPrices(
    stripeProductIds: string[],
  ): Promise<Record<string, StripePriceInfo[]>> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/stripe/products/batch-prices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productIds: stripeProductIds }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch batch prices: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch batch prices");
      }

      // Transform the response to match expected format
      const results: Record<string, StripePriceInfo[]> = {};
      Object.entries(data.data).forEach(([productId, productData]) => {
        const typedProductData = productData as {
          prices: StripePriceInfo[];
          lowestPrice: StripePriceInfo | null;
        };
        results[productId] = typedProductData.prices || [];
      });

      return results;
    } catch (error) {
      console.error("Error fetching batch Stripe prices:", error);
      return {};
    }
  },

  /**
   * Get lowest prices for multiple products in batch
   * Optimized to reuse the same API call as getBatchProductPrices
   */
  async getBatchLowestPrices(
    stripeProductIds: string[],
  ): Promise<Record<string, StripePriceInfo | null>> {
    try {
      const batchPrices =
        await stripePriceApiService.getBatchProductPrices(stripeProductIds);

      // Extract lowest prices from the batch data
      const results: Record<string, StripePriceInfo | null> = {};
      Object.entries(batchPrices).forEach(([productId, prices]) => {
        results[productId] = prices.length > 0 ? prices[0] : null; // First price is already the lowest
      });

      return results;
    } catch (error) {
      console.error("Error fetching batch lowest prices:", error);
      return {};
    }
  },
};
