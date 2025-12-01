"use client";

import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import { useProductStripePrices } from "./use-stripe-prices";
import type { Product } from "../types";

interface UseProductDetailOptions {
  slug: string;
}

interface UseProductDetailReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch a single product with Stripe prices for product detail page
 */
export function useProductDetail({
  slug,
}: UseProductDetailOptions): UseProductDetailReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the new method that includes Stripe pricing
      const fetchedProduct =
        await productService.getProductBySlugWithStripePricing(slug);
      setProduct(fetchedProduct);
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch product");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Fetch Stripe prices for the product
  const {
    prices,
    loading: pricesLoading,
    error: pricesError,
    refetch: refetchPrices,
  } = useProductStripePrices(product);

  // Update product with Stripe prices
  useEffect(() => {
    if (product && prices.length > 0) {
      setProduct((prev) => (prev ? { ...prev, stripe_prices: prices } : null));
    }
  }, [product, prices]);

  return {
    product,
    loading: loading || pricesLoading,
    error: error || pricesError,
    refetch: () => {
      fetchProduct();
      refetchPrices();
    },
  };
}
