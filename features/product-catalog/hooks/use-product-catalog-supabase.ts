"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@core/supabase/client";
import type { Product, ProductFilters } from "../types";
import { filterProducts } from "../utils";
import { productService } from "../services/productService";
import { useStripePrices } from "./use-stripe-prices";

interface UseProductCatalogOptions {
  filters?: ProductFilters;
  initialLoading?: boolean;
}

interface UseProductCatalogReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  applyFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
}

/**
 * Hook for managing product catalog data from Supabase
 * Uses productService for type-safe data operations
 */
export function useProductCatalogSupabase({
  filters = {},
  initialLoading = true,
}: UseProductCatalogOptions = {}): UseProductCatalogReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>(filters);

  const supabase = createClient();

  /**
   * Fetch products with category data from Supabase
   * Uses direct JOIN query for efficiency
   */
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          category:categories(name, color)
        `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        throw error;
      }

      // Transform using productService for consistency
      const transformedProducts: Product[] = data.map((product) =>
        productService.transformProduct(product),
      );

      return transformedProducts;
    } catch (err) {
      console.error("Error in fetchProducts:", err);
      throw err;
    }
  }, [supabase]);

  /**
   * Fetch all data from Supabase
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsData] = await Promise.all([fetchProducts()]);

      setProducts(productsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      console.error("Error fetching product catalog data:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  /**
   * Filter products based on current filters
   */
  const filteredProducts = useMemo(() => {
    return filterProducts(products, currentFilters);
  }, [products, currentFilters]);

  // Fetch Stripe prices for filtered products
  const {
    productsWithPrices,
    loading: pricesLoading,
    error: pricesError,
    refetch: refetchPrices,
  } = useStripePrices({
    products: filteredProducts,
    enabled: filteredProducts.length > 0,
  });

  /**
   * Apply new filters
   */
  const applyFilters = useCallback((newFilters: ProductFilters) => {
    setCurrentFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setCurrentFilters({});
  }, []);

  /**
   * Refetch data
   */
  const refetch = useCallback(() => {
    fetchData();
    refetchPrices();
  }, [fetchData, refetchPrices]);

  // Update current filters when external filters change
  useEffect(() => {
    setCurrentFilters(filters);
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    if (initialLoading) {
      fetchData();
    }
  }, [fetchData, initialLoading]);

  return {
    products: productsWithPrices,
    loading: loading || pricesLoading,
    error: error || pricesError,
    refetch,
    applyFilters,
    clearFilters,
  };
}
