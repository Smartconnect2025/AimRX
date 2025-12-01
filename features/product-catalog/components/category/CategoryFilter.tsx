"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/tailwind-utils";
import { useCategoryFilter } from "../../hooks/use-category-filter";

interface CategoryFilterProps {
  className?: string;
  showProductCounts?: boolean;
}

export function CategoryFilter({
  className,
  showProductCounts = true,
}: CategoryFilterProps) {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    isActive,
    clearSelection,
  } = useCategoryFilter();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
        {selectedCategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="text-slate-500 hover:text-slate-700"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {/* All Categories Option */}
        <Button
          variant={!selectedCategory ? "default" : "ghost"}
          className={cn(
            "w-full justify-start h-auto p-3",
            !selectedCategory && "bg-slate-900 text-white hover:bg-slate-800",
          )}
          onClick={() => clearSelection()}
        >
          <div className="flex items-center justify-between w-full">
            <span>All Categories</span>
            {showProductCounts && (
              <Badge
                variant="secondary"
                className="ml-2 border-border text-black"
              >
                {categories.reduce(
                  (total, cat) => total + cat.product_count,
                  0,
                )}
              </Badge>
            )}
          </div>
        </Button>

        {/* Individual Categories */}
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={isActive(category.id) ? "default" : "ghost"}
            className={cn(
              "w-full justify-start h-auto p-3 transition-colors",
              isActive(category.id) &&
                "bg-primary/90 border-gray-300 text-black hover:bg-primary/90",
            )}
            onClick={() => setSelectedCategory(category)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-600" />
                <span className="font-medium">{category.name}</span>
              </div>
              {showProductCounts && (
                <Badge
                  variant={isActive(category.id) ? "secondary" : "outline"}
                  className={cn(
                    "ml-2",
                    isActive(category.id)
                      ? "bg-white/20 text-white border-white/30"
                      : "border border-border",
                  )}
                >
                  {category.product_count}
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>

      {/* Category Description */}
      {selectedCategory && (
        <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-border">
          <p className="text-sm text-slate-600">
            Category: {selectedCategory.name}
          </p>
        </div>
      )}
    </div>
  );
}
