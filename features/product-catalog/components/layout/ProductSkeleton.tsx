"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/tailwind-utils";

interface ProductSkeletonProps {
  className?: string;
}

export function ProductSkeleton({ className }: ProductSkeletonProps) {
  return (
    <div className={cn("group relative flex flex-col w-full", className)}>
      {/* Product Image Skeleton */}
      <div className="relative h-[340px] md:h-[420px] overflow-hidden mb-6 rounded-2xl">
        <Skeleton className="w-full h-full" />
      </div>

      <div className="flex-1 space-y-3">
        {/* Category Skeleton */}
        <div>
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Product Name Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
        </div>

        {/* Price Skeleton */}
        <div>
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Benefits Skeleton */}
        <div className="pt-2">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="mt-6">
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
} 