"use client";

import type { ProductFilters } from "../types";
import { useProductCatalogSupabase } from "./use-product-catalog-supabase";

interface UseProductCatalogOptions {
  filters?: ProductFilters;
  initialLoading?: boolean;
}

/**
 * Main hook for product catalog - now reads directly from database
 * All mock data functionality removed
 */
export function useProductCatalog(options: UseProductCatalogOptions = {}) {
  return useProductCatalogSupabase(options);
}
