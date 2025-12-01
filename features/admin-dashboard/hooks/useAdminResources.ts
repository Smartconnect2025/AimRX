"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  Resource,
  CreateResourceData,
  UpdateResourceData,
} from "../types";

export function useAdminResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchResources = useCallback(
    async (
      page: number = 1,
      filters?: { search?: string; type?: string; tags?: string },
    ) => {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(page);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        });

        if (filters?.search) params.append("search", filters.search);
        if (filters?.type) params.append("type", filters.type);
        if (filters?.tags) params.append("tags", filters.tags);

        const response = await fetch(
          `/api/admin/resources?${params.toString()}`,
        );
        if (!response.ok) throw new Error("Failed to fetch resources");

        const data = await response.json();
        setResources(data.resources || []);
        setTotalCount(data.total || 0);

        // Extract unique tags from resources
        const tags = new Set<string>();
        data.resources?.forEach((resource: Resource) => {
          resource.tags?.forEach((tag) => tags.add(tag));
        });
        setAllTags(Array.from(tags).sort());
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch resources",
        );
        toast.error("Failed to fetch resources");
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  const createResource = useCallback(async (data: CreateResourceData) => {
    try {
      const response = await fetch("/api/admin/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create resource");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Error creating resource:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create resource",
      );
      throw err;
    }
  }, []);

  const updateResource = useCallback(
    async (id: string, data: UpdateResourceData) => {
      try {
        const response = await fetch(`/api/admin/resources/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update resource");
        }

        const result = await response.json();
        return result;
      } catch (err) {
        console.error("Error updating resource:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update resource",
        );
        throw err;
      }
    },
    [],
  );

  const deleteResource = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/admin/resources/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete resource");
        }

        // If we're on the last page and it becomes empty after deletion, go to previous page
        const totalPages = Math.ceil(totalCount / pageSize);
        if (currentPage > 1 && currentPage > totalPages) {
          setCurrentPage(currentPage - 1);
          fetchResources(currentPage - 1);
        } else {
          // Refresh current page
          fetchResources(currentPage);
        }
      } catch (err) {
        console.error("Error deleting resource:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete resource",
        );
        throw err;
      }
    },
    [currentPage, totalCount, pageSize, fetchResources],
  );

  const refreshResources = useCallback(
    (filters?: { search?: string; type?: string; tags?: string }) => {
      fetchResources(currentPage, filters);
    },
    [fetchResources, currentPage],
  );

  const handlePageChange = useCallback(
    (
      page: number,
      filters?: { search?: string; type?: string; tags?: string },
    ) => {
      setCurrentPage(page);
      fetchResources(page, filters);
    },
    [fetchResources],
  );

  // Initial fetch
  useEffect(() => {
    fetchResources(currentPage);
  }, [fetchResources, currentPage]);

  return {
    resources,
    allTags,
    loading,
    error,
    currentPage,
    totalCount,
    pageSize,
    createResource,
    updateResource,
    deleteResource,
    refreshResources,
    handlePageChange,
    fetchResources,
  };
}
