"use client";

import type { Product } from "../../types";
import { BackButton } from "./BackButton";
import { ProductHero } from "./ProductHero";

interface ProductDetailPageProps {
  product: Product;
}

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  return (
    <div className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <BackButton fallbackUrl="/admin/products" fallbackParam="admin" />

        {/* Hero Section */}
        <ProductHero product={product} />
      </div>
    </div>
  );
}
