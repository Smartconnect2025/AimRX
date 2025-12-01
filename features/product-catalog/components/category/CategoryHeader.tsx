"use client";

import { cn } from "@/utils/tailwind-utils";
import type { Category } from "../../types";

interface CategoryHeaderProps {
  category: Category;
  className?: string;
}

export function CategoryHeader({ category, className }: CategoryHeaderProps) {
  return (
    <section
      className={cn(
        "relative text-white py-24 md:py-32 overflow-hidden",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(var(--primary) / 0.13) 0%, hsl(var(--primary) / 0.27) 50%, hsl(var(--primary) / 0.4) 100%)`,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.2) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-3 h-12 rounded-full bg-primary" />
            <span className="text-sm font-medium tracking-widest uppercase text-white">
              Category
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">
            {category.name}
          </h1>

          <p className="text-lg md:text-xl text-slate-700 mb-8 max-w-2xl">
            Browse products in the {category.name} category
          </p>

          <div className="flex items-center gap-6 text-slate-600">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5v3m6-3v3"
                />
              </svg>
              <span className="font-medium">
                {category.product_count}{" "}
                {category.product_count === 1 ? "Product" : "Products"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">Quality Assured</span>
            </div>
          </div>
        </div>

        {/* Decorative Image - Removed since image_url field was removed */}
      </div>
    </section>
  );
}
