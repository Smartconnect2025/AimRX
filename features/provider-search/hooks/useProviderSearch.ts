"use client";

import { useState, useEffect } from "react";
import { Provider, SearchFilters } from "../types";
import { createClient } from "@core/supabase/client";
import { getNextAvailableSlots } from "../get-next-available-slots";

export function useProviderSearch(filters: SearchFilters) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        // Build the query
        let query = supabase
          .from("providers")
          .select(
            `
            id,
            first_name,
            last_name,
            specialty,
            avatar_url,
            licensed_states,
            service_types,
            insurance_plans
          `,
          )
          .eq("is_active", true);

        // Apply search query filter if provided
        const trimmedSearchQuery = filters.searchQuery?.trim();
        if (trimmedSearchQuery) {
          // Create unique search patterns using Set for deduplication
          const searchPatterns = new Set([
            `first_name.ilike.%${trimmedSearchQuery}%`, // First name match
            `last_name.ilike.%${trimmedSearchQuery}%`, // Last name match
            `specialty.ilike.%${trimmedSearchQuery}%`, // Specialty match
          ]);

          // For multi-word searches, add patterns for each meaningful word
          if (trimmedSearchQuery.includes(" ")) {
            const excludedTitles = new Set(["dr", "mr", "ms", "mrs", "prof"]);
            const words = trimmedSearchQuery
              .split(" ")
              .filter(
                (word) =>
                  word.length > 0 && !excludedTitles.has(word.toLowerCase()),
              );

            words.forEach((word) => {
              searchPatterns.add(`first_name.ilike.%${word}%`);
              searchPatterns.add(`last_name.ilike.%${word}%`);
            });
          }

          // Join all unique patterns with OR
          const searchQuery = Array.from(searchPatterns).join(",");
          query = query.or(searchQuery);
        }

        // Apply licensed state filter at database level
        if (filters.licensedState) {
          query = query.contains("licensed_states", [filters.licensedState]);
        }

        // Apply service types filter at database level
        if (filters.serviceTypes && filters.serviceTypes.length > 0) {
          query = query.overlaps("service_types", filters.serviceTypes);
        }

        // Apply insurance plans filter at database level
        if (filters.insurancePlans && filters.insurancePlans.length > 0) {
          query = query.overlaps("insurance_plans", filters.insurancePlans);
        }

        // If no search query and no filters, limit to 6 providers for initial display
        // If there's a search query or filters, don't limit (search all providers)
        const hasSearchOrFilters =
          Boolean(trimmedSearchQuery) ||
          filters.licensedState ||
          (filters.serviceTypes && filters.serviceTypes.length > 0) ||
          (filters.insurancePlans && filters.insurancePlans.length > 0);

        if (!hasSearchOrFilters) {
          query = query.limit(6); // Show only 6 providers initially
        } else {
          query = query.limit(100); // Search all providers when filtering
        }

        const { data, error } = await query;
        if (error) throw error;

        // Use database search results directly - filtering is now done at database level
        const filteredProviders = data || [];

        // For each provider, fetch next available slots (5 slots)
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const mappedProviders: Provider[] = await Promise.all(
          filteredProviders.map(async (provider: any) => {
            try {
              const nextSlots = await getNextAvailableSlots(provider.id, 30, 5);
              return {
                id: provider.id,
                first_name: provider.first_name,
                last_name: provider.last_name,
                specialty: provider.specialty,
                avatarUrl: provider.avatar_url || "",
                licensedStates: provider.licensed_states || [],
                serviceTypes: provider.service_types || [],
                insurancePlans: provider.insurance_plans || [],
                availability: {
                  status: nextSlots.length > 0 ? "scheduled" : "unavailable",
                  nextSlots,
                },
              };
            } catch {
              // Return provider with unavailable status if slot fetching fails
              return {
                id: provider.id,
                first_name: provider.first_name,
                last_name: provider.last_name,
                specialty: provider.specialty,
                avatarUrl: provider.avatar_url || "",
                licensedStates: provider.licensed_states || [],
                serviceTypes: provider.service_types || [],
                insurancePlans: provider.insurance_plans || [],
                availability: {
                  status: "unavailable",
                  nextSlots: [],
                },
              };
            }
          }),
        );

        setProviders(mappedProviders);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error fetching providers",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchProviders();
  }, [filters]);

  return { providers, isLoading, error };
}
