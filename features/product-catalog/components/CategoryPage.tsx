"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useProductCatalog } from "../hooks/use-product-catalog";
import type { CategoryPageProps } from "../types";
import { ProductGrid } from "./ProductGrid";
import { CategoryHeader } from "./category/CategoryHeader";

export function CategoryPage({
  category,
  products: initialProducts,
}: CategoryPageProps) {
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Memoize filters to prevent infinite re-renders
  const filters = useMemo(
    () => ({
      category_id: category.id,
      in_stock_only: showInStockOnly,
    }),
    [category.id, showInStockOnly],
  );

  const { products, loading, error, refetch, applyFilters } = useProductCatalog(
    { filters, initialLoading: false },
  );

  const handleStockFilter = (inStockOnly: boolean) => {
    setShowInStockOnly(inStockOnly);
    applyFilters({ in_stock_only: inStockOnly });
  };

  // Use provided products initially or fallback to hook data
  const displayProducts = products.length > 0 ? products : initialProducts;

  return (
    <div className="min-h-screen bg-white">
      {/* Category Header */}
      <CategoryHeader category={category} />

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/catalog" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </Link>
          </Button>
          <div className="text-slate-400">|</div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/catalog"
              className="text-slate-500 hover:text-slate-700"
            >
              Catalog
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">{category.name}</span>
          </nav>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              {/* Category Info */}
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    {category.name}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm mb-4">
                  Browse products in the {category.name} category
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {category.product_count}{" "}
                    {category.product_count === 1 ? "Product" : "Products"}
                  </Badge>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Filter Products
                </h3>

                {/* Stock Filter */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700">Availability</h4>
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
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  {category.name} Products
                </h2>
                {!loading && (
                  <Badge variant="secondary">
                    {displayProducts.length}{" "}
                    {displayProducts.length === 1 ? "product" : "products"}
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={cn("w-4 h-4", loading && "animate-spin")}
                />
                Refresh
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
            {showInStockOnly && !loading && (
              <div className="mb-6">
                <Badge variant="outline" className="px-3 py-1">
                  In stock only
                </Badge>
              </div>
            )}

            {/* Product Grid */}
            <ProductGrid
              products={displayProducts}
              loading={loading}
              className="mb-8"
            />

            {/* Empty State for Category */}
            {!loading && displayProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-500" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No products found in {category.name}
                </h3>
                <p className="text-slate-500 mb-6">
                  There are currently no products available in this category.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/catalog">Browse All Products</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
