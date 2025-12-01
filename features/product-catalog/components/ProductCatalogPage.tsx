"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/utils/tailwind-utils";
import { ProductGrid } from "./ProductGrid";
import { CategoryFilter } from "./category/CategoryFilter";
import { useProductCatalog } from "../hooks/use-product-catalog";
import { useCategoryFilter } from "../hooks/use-category-filter";

interface ProductCatalogPageProps {
  className?: string;
}

export function ProductCatalogPage({ className }: ProductCatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { selectedCategory } = useCategoryFilter();

  // Memoize filters to prevent infinite re-renders
  const filters = useMemo(
    () => ({
      category_id: selectedCategory?.id,
      search_query: searchQuery || undefined,
      in_stock_only: showInStockOnly,
    }),
    [selectedCategory?.id, searchQuery, showInStockOnly],
  );

  const { products, loading, error, refetch, applyFilters, clearFilters } =
    useProductCatalog({
      filters,
    });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    applyFilters({ search_query: value || undefined });
  };

  const handleStockFilter = (inStockOnly: boolean) => {
    setShowInStockOnly(inStockOnly);
    applyFilters({ in_stock_only: inStockOnly });
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setShowInStockOnly(false);
    clearFilters();
  };

  const activeFiltersCount = [
    selectedCategory ? 1 : 0,
    searchQuery ? 1 : 0,
    showInStockOnly ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className={cn("min-h-screen bg-white", className)}>
      {/* Header */}
      <div className="bg-slate-50 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          <div className="mx-auto text-center">
            {/* Search Bar */}
            <div className="relative mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg border-slate-200 focus:border-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-12">
          {/* Sidebar Filters */}
          <div className="lg:w-80 xl:w-72 2xl:w-80 flex-shrink-0">
            <div className="sticky top-4 space-y-4 sm:space-y-6">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="justify-between border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </div>
                </Button>
              </div>

              {/* Filter Content */}
              <div
                className={cn(
                  "space-y-6",
                  "lg:block",
                  showFilters ? "block" : "hidden",
                )}
              >
                {/* Category Filter */}
                <CategoryFilter />

                {/* Stock Filter */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Availability
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInStockOnly}
                        onChange={(e) => handleStockFilter(e.target.checked)}
                        className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                      />
                      <span className="text-slate-700">In stock only</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleClearAll}
                    className="w-full border-gray-100 shadow-sm"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">
                  {selectedCategory ? selectedCategory.name : "All Products"}
                </h2>
                {!loading && (
                  <Badge variant="secondary" className="w-fit">
                    {products.length}{" "}
                    {products.length === 1 ? "product" : "products"}
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2 w-fit self-start sm:self-auto"
              >
                <RefreshCw
                  className={cn("w-4 h-4", loading && "animate-spin")}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            {/* Error State */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Active Filters */}
            {activeFiltersCount > 0 && !loading && (
              <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
                {selectedCategory && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 border border-border"
                  >
                    Category: {selectedCategory.name}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 border border-border"
                  >
                    Search: &quot;{searchQuery}&quot;
                  </Badge>
                )}
                {showInStockOnly && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 border border-border"
                  >
                    In stock only
                  </Badge>
                )}
              </div>
            )}

            {/* Product Grid */}
            <ProductGrid
              products={products}
              loading={loading}
              className="mb-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
