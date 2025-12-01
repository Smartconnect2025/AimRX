"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "../../types";
import { ProductActions } from "./ProductActions";
import { Badge } from "@/components/ui/badge";

interface ProductHeroProps {
  product: Product;
}

export function ProductHero({ product }: ProductHeroProps) {
  return (
    <div
      className="relative grid gap-6 sm:gap-8 lg:gap-12 xl:gap-16 md:grid-cols-2 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #25273D 0%, #004EFF 136%)",
      }}
    >
      {/* Decorative gradient overlays */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-purple-500/20 to-transparent pointer-events-none rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/20 to-transparent pointer-events-none rounded-full blur-3xl" />

      {product.is_best_seller && (
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="secondary">Best Seller</Badge>
        </div>
      )}

      {/* Product Image */}
      <div className="flex justify-center items-center relative z-10 order-2 md:order-1">
        <div className="relative w-full sm:w-[80%] md:w-full lg:w-[90%] xl:w-[80%] aspect-square">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              className="object-contain w-full h-full"
              width={500}
              height={500}
              priority
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col justify-center space-y-4 sm:space-y-6 relative z-10 order-1 md:order-2">
        <div className="space-y-3 sm:space-y-4">
          {product.category_name && (
            <Link
              href={`/catalog?category=${product.category_name.toLowerCase()}`}
              className="text-xs sm:text-sm uppercase text-[#F23B00] font-medium tracking-widest hover:underline inline-block"
            >
              {product.category_name}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-tight">
            {product.name}
          </h1>

          <div
            className="text-white pt-4 sm:pt-6 pb-2 leading-relaxed text-sm sm:text-base lg:text-lg prose prose-invert max-w-none [&>*]:text-white [&>*]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description || "" }}
          />

          {/* Stock Status */}
          <div className="pt-2">
            {product.stock_quantity > 0 ? (
              <p className="text-green-300 text-sm sm:text-base">
                ✓ In Stock ({product.stock_quantity} available)
              </p>
            ) : (
              <p className="text-red-300 text-sm sm:text-base">
                ✗ Out of Stock
              </p>
            )}
          </div>
        </div>

        {/* Client component for subscription options and add to cart */}
        <ProductActions product={product} />
      </div>
    </div>
  );
}
