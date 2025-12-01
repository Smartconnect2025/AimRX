"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "../types";

export function useAdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories",
      );
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: CreateCategoryData) => {
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }

      const result = await response.json();
      toast.success("Category created successfully");
      return result;
    } catch (err) {
      console.error("Error creating category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
      throw err;
    }
  }, []);

  const updateCategory = useCallback(
    async (id: number, data: UpdateCategoryData) => {
      try {
        const response = await fetch(`/api/admin/categories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update category");
        }

        const result = await response.json();
        toast.success("Category updated successfully");
        return result;
      } catch (err) {
        console.error("Error updating category:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update category",
        );
        throw err;
      }
    },
    [],
  );

  const deleteCategory = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully");
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete category",
      );
      throw err;
    }
  }, []);

  const refreshCategories = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
  };
}
