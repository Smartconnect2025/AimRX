"use client";

import { useState, useEffect } from "react";
import { createClient } from "@core/supabase/client";

export function useServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServiceTypes() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch all providers with their service_types
        const { data: providers, error } = await supabase
          .from("providers")
          .select("service_types")
          .not("service_types", "is", null);

        if (error) throw error;

        // Extract unique service types from all providers
        const allServiceTypes = new Set<string>();

        providers?.forEach((provider) => {
          if (provider.service_types && Array.isArray(provider.service_types)) {
            provider.service_types.forEach((type: string) => {
              if (type && type.trim()) {
                allServiceTypes.add(type.trim());
              }
            });
          }
        });

        // Convert Set to sorted array
        const uniqueServiceTypes = Array.from(allServiceTypes).sort();

        // Filter to only show the specific service types we want
        const allowedServiceTypes = ["Telehealth", "In-person"];
        const filteredServiceTypes = uniqueServiceTypes.filter((type) =>
          allowedServiceTypes.includes(type),
        );

        // If no service types found in database, use the default ones
        const finalServiceTypes =
          filteredServiceTypes.length > 0
            ? filteredServiceTypes
            : allowedServiceTypes;

        setServiceTypes(finalServiceTypes);
      } catch (err) {
        console.error("Error fetching service types:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch service types",
        );
        // Use default service types as fallback
        setServiceTypes(["Telehealth", "In-person"]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchServiceTypes();
  }, []);

  return { serviceTypes, isLoading, error };
}
