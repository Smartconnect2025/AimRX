"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  Product,
  Category,
  CreateProductData,
  UpdateProductData,
} from "../types";

export function useAdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchProducts = useCallback(
    async (
      page: number = 1,
      filters?: { search?: string; category_id?: string },
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
        if (filters?.category_id)
          params.append("category_id", filters.category_id);

        const response = await fetch(
          `/api/admin/products?${params.toString()}`,
        );
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        setProducts(data.products || []);
        setTotalCount(data.total || 0);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch products",
        );
        toast.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      // Don't show error toast for categories, just log it
    }
  }, []);

  const createProduct = useCallback(async (data: CreateProductData) => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      const result = await response.json();
      toast.success("Product created successfully");
      return result;
    } catch (err) {
      console.error("Error creating product:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create product",
      );
      throw err;
    }
  }, []);

  const updateProduct = useCallback(
    async (id: number, data: UpdateProductData) => {
      try {
        const response = await fetch(`/api/admin/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update product");
        }

        const result = await response.json();
        toast.success("Product updated successfully");
        return result;
      } catch (err) {
        console.error("Error updating product:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update product",
        );
        throw err;
      }
    },
    [],
  );

  const deleteProduct = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete product");
        }

        // If we're on the last page and it becomes empty after deletion, go to previous page
        const totalPages = Math.ceil(totalCount / pageSize);
        if (currentPage > 1 && currentPage > totalPages) {
          setCurrentPage(currentPage - 1);
          fetchProducts(currentPage - 1);
        } else {
          // Refresh current page
          fetchProducts(currentPage);
        }

        toast.success("Product deleted successfully");
      } catch (err) {
        console.error("Error deleting product:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete product",
        );
        throw err;
      }
    },
    [currentPage, totalCount, pageSize, fetchProducts],
  );

  const bulkUpdateProducts = useCallback(
    async (productIds: string[], updates: Partial<UpdateProductData>) => {
      try {
        const response = await fetch("/api/admin/products/bulk", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_ids: productIds,
            updates,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update products");
        }

        toast.success(`${productIds.length} products updated successfully`);
        return await response.json();
      } catch (err) {
        console.error("Error updating products:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update products",
        );
        throw err;
      }
    },
    [],
  );

  const refreshProducts = useCallback(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchProducts(page);
    },
    [fetchProducts],
  );

  // Initial fetch
  useEffect(() => {
    fetchProducts(currentPage);
    fetchCategories();
  }, [fetchProducts, currentPage, fetchCategories]);

  return {
    products,
    categories,
    loading,
    error,
    currentPage,
    totalCount,
    pageSize,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
    handlePageChange,
    fetchProducts,
    bulkUpdateProducts,
  };
}
