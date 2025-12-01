"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";

interface SearchFilters {
  licensedState?: string;
  serviceTypes?: string[];
  insurancePlans?: string[];
}

// interface SearchState {
//   query: string;
//   filters: SearchFilters;
// }

interface UseSearchParamsSyncOptions {
  isModal?: boolean;
  debounceMs?: number;
}

export function useSearchParamsSync(options: UseSearchParamsSyncOptions = {}) {
  const { isModal = false, debounceMs = 500 } = options;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current search state from URL
  const searchState = useMemo(() => {
    const query = searchParams.get("q") || "";
    const filtersParam = searchParams.get("filters");

    let filters: SearchFilters = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(decodeURIComponent(filtersParam));
      } catch (error) {
        console.warn("Failed to parse filters from URL:", error);
      }
    }

    return { query, filters };
  }, [searchParams]);

  // Debounced URL update function
  const debouncedUpdateUrl = useDebouncedCallback(
    (query: string, filters: SearchFilters) => {
      if (isModal) return;

      const params = new URLSearchParams();

      if (query.trim()) {
        params.set("q", query.trim());
      }

      if (Object.keys(filters).length > 0) {
        params.set("filters", encodeURIComponent(JSON.stringify(filters)));
      }

      const newUrl = params.toString()
        ? `?${params.toString()}`
        : "/provider-search";
      const currentUrl = searchParams.toString()
        ? `?${searchParams.toString()}`
        : "/provider-search";

      // Only update URL if it's different to avoid unnecessary navigation
      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false });
      }
    },
    debounceMs,
  );

  // Update search query
  const updateQuery = useCallback(
    (query: string) => {
      debouncedUpdateUrl(query, searchState.filters);
    },
    [debouncedUpdateUrl, searchState.filters],
  );

  // Update filters
  const updateFilters = useCallback(
    (filters: SearchFilters) => {
      debouncedUpdateUrl(searchState.query, filters);
    },
    [debouncedUpdateUrl, searchState.query],
  );

  // Update both query and filters
  const updateSearchState = useCallback(
    (updates: { query?: string; filters?: SearchFilters }) => {
      const newQuery =
        updates.query !== undefined ? updates.query : searchState.query;
      const newFilters =
        updates.filters !== undefined ? updates.filters : searchState.filters;
      debouncedUpdateUrl(newQuery, newFilters);
    },
    [debouncedUpdateUrl, searchState.query, searchState.filters],
  );

  // Clear all search state
  const clearSearch = useCallback(() => {
    if (isModal) return;
    router.replace("/provider-search", { scroll: false });
  }, [router, isModal]);

  return {
    searchState,
    updateQuery,
    updateFilters,
    updateSearchState,
    clearSearch,
  };
}
