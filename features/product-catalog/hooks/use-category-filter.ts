"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@core/supabase/client";
import type { Category } from "../types";
import { productService } from "../services/productService";

interface UseCategoryFilterReturn {
  categories: Category[];
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  isActive: (categoryId: number) => boolean;
  clearSelection: () => void;
  loading: boolean;
}

export function useCategoryFilter(): UseCategoryFilterReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategoryState] =
    useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const [categoriesResult, productsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("products")
          .select("id, category_id")
          .eq("is_active", true),
      ]);

      if (categoriesResult.error) {
        console.error("Error fetching categories:", categoriesResult.error);
        return;
      }

      if (productsResult.error) {
        console.error("Error fetching products:", productsResult.error);
        return;
      }

      const transformedCategories = categoriesResult.data.map((cat) =>
        productService.transformCategory(cat),
      );

      const categoriesWithCounts = transformedCategories.map((category) => ({
        ...category,
        product_count: productsResult.data.filter(
          (product) => product.category_id === category.id,
        ).length,
      }));

      setCategories(categoriesWithCounts);
    } catch (err) {
      console.error("Error in fetchCategories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Find category by slug
  const getCategoryBySlug = useCallback(
    (slug: string): Category | null => {
      return categories.find((cat) => cat.slug === slug) || null;
    },
    [categories],
  );

  // Update selected category when URL changes
  useEffect(() => {
    const categorySlug = searchParams.get("category");
    if (categorySlug && categories.length > 0) {
      const category = getCategoryBySlug(categorySlug);
      setSelectedCategoryState(category || null);
    } else {
      setSelectedCategoryState(null);
    }
  }, [searchParams, categories, getCategoryBySlug]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Set selected category and update URL
  const setSelectedCategory = useCallback(
    (category: Category | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (category) {
        params.set("category", category.slug);
      } else {
        params.delete("category");
      }

      // Update URL without page refresh
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  // Check if a category is currently active
  const isActive = useCallback(
    (categoryId: number) => {
      return selectedCategory?.id === categoryId;
    },
    [selectedCategory],
  );

  // Clear category selection
  const clearSelection = useCallback(() => {
    setSelectedCategory(null);
  }, [setSelectedCategory]);

  return {
    categories,
    selectedCategory,
    setSelectedCategory,
    isActive,
    clearSelection,
    loading,
  };
}
