"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import {
  fetchAllResourceTags,
  fetchResourcesFromDb,
} from "../services/resourceService";
import { Resource, ResourceType } from "../types";
import { aggregateUniqueTags } from "../utils/tagUtils";

interface UseResourcesOptions {
  searchTerm?: string;
  selectedTypes?: ResourceType[];
  activeTags?: string[];
  page?: number;
  itemsPerPage?: number;
}

export function useResources({
  searchTerm = "",
  selectedTypes = [],
  activeTags = [],
  page = 1,
  itemsPerPage = 12,
}: UseResourcesOptions) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useDebouncedCallback(
    async (
      debouncedSearchTerm: string,
      types: ResourceType[],
      tags: string[],
      currentPage: number,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error, count } = await fetchResourcesFromDb({
          searchTerm: debouncedSearchTerm,
          selectedTypes: types,
          activeTags: tags,
          page: currentPage,
          itemsPerPage,
        });
        if (error) {
          setResources([]);
          setTotalCount(0);
          setError("Failed to fetch resources. Please try again.");
          setLoading(false);
          return;
        }

        // Service now returns properly typed Resources
        setResources(data || []);
        setTotalCount(count || 0);
      } catch {
        setResources([]);
        setTotalCount(0);
        setError("Error fetching resources. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    300,
  );

  const fetchTags = useCallback(async () => {
    try {
      const { data, error } = await fetchAllResourceTags();
      if (error) return;
      setAllTags(aggregateUniqueTags((data as { tags: string[] }[]) ?? []));
    } catch {}
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchResources(searchTerm, selectedTypes, activeTags, page);
  }, [fetchResources, searchTerm, selectedTypes, activeTags, page]);

  return {
    resources,
    totalCount,
    allTags,
    loading,
    error,
    totalPages: Math.ceil(totalCount / itemsPerPage),
  };
}
