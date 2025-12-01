"use client";

import { cn } from "@/utils/tailwind-utils";
import type { ProductGridProps } from "../types";
import { ProductCard } from "./product/ProductCard";
import { ProductSkeleton } from "./layout/ProductSkeleton";

export function ProductGrid({
  products,
  loading = false,
  className,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4",
          className,
        )}
      >
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-slate-300 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5v3m6-3v3"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No products found
          </h3>
          <p className="text-slate-500">
            We couldn&apos;t find any products matching your criteria. Try
            adjusting your filters or search terms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showCategory={true} />
      ))}
    </div>
  );
}
