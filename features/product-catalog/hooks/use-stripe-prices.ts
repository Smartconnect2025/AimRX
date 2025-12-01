"use client";

import { useState, useEffect, useCallback } from "react";
import { stripePriceApiService } from "../services/stripe-price-service.client";
import type { Product, StripePriceInfo } from "../types";

interface UseStripePricesOptions {
  products: Product[];
  enabled?: boolean;
}

interface UseStripePricesReturn {
  productsWithPrices: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch Stripe prices for products
 */
export function useStripePrices({
  products,
  enabled = true,
}: UseStripePricesOptions): UseStripePricesReturn {
  const [productsWithPrices, setProductsWithPrices] =
    useState<Product[]>(products);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!enabled || products.length === 0) {
      setProductsWithPrices(products);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter products that have Stripe product IDs
      const productsWithStripeIds = products.filter((p) => p.stripe_product_id);

      if (productsWithStripeIds.length === 0) {
        setProductsWithPrices(products);
        setLoading(false);
        return;
      }

      // Fetch lowest prices for grid display
      const stripeProductIds = productsWithStripeIds.map(
        (p) => p.stripe_product_id!,
      );
      const lowestPrices =
        await stripePriceApiService.getBatchLowestPrices(stripeProductIds);

      // Update products with their prices
      // Note: We only need the lowest price for grid display, so we use the optimized batch call
      const updatedProducts = products.map((product) => {
        if (
          product.stripe_product_id &&
          lowestPrices[product.stripe_product_id]
        ) {
          return {
            ...product,
            stripe_prices: [lowestPrices[product.stripe_product_id]!], // Only lowest price for grid
          };
        }
        return product;
      });

      setProductsWithPrices(updatedProducts);
    } catch (err) {
      console.error("Error fetching Stripe prices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      setProductsWithPrices(products); // Fallback to original products
    } finally {
      setLoading(false);
    }
  }, [products, enabled]);

  const refetch = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    productsWithPrices,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch all prices for a single product (for product detail page)
 */
export function useProductStripePrices(product: Product | null): {
  prices: StripePriceInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [prices, setPrices] = useState<StripePriceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!product?.stripe_product_id) {
      setPrices([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedPrices = await stripePriceApiService.getProductPrices(
        product.stripe_product_id,
      );
      setPrices(fetchedPrices);
    } catch (err) {
      console.error("Error fetching product Stripe prices:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      setPrices([]);
    } finally {
      setLoading(false);
    }
  }, [product?.stripe_product_id]);

  const refetch = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch,
  };
}
