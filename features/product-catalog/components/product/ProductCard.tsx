"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";
import type { ProductCardProps } from "../../types";
import { isProductInStock, getStockStatus } from "../../utils";
import { PRODUCT_CARD_CONFIG } from "../../constants";
import { Card } from "@/components/ui/card";

export function ProductCard({
  product,
  showCategory = true,
  className,
}: ProductCardProps) {
  const inStock = isProductInStock(product.stock_quantity);
  const stockStatus = getStockStatus(product.stock_quantity);

  // Get the lowest price from Stripe (for grid display)
  // The prices array is sorted with the lowest price first (monthly prioritized)
  const lowestPrice = product.stripe_prices?.[0];

  return (
    <div className={cn("group relative flex flex-col w-full", className)}>
      <Link href={`/catalog/product/${product.slug}`} className="block">
        <Card
          className="relative aspect-[4/3] overflow-hidden mb-6 rounded-lg"
          // style={{
          //   background: PRODUCT_CARD_CONFIG.GRADIENT_BACKGROUND,
          // }}
        >
          {product.image_url ? (
            <div className="w-full h-full flex items-center justify-center p-6">
              <Image
                src={product.image_url}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                width={300}
                height={300}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = PRODUCT_CARD_CONFIG.DEFAULT_IMAGE;
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center text-xl font-medium text-muted-foreground">
              No image available
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {!inStock && (
              <Badge
                variant="secondary"
                className="bg-destructive text-white border-destructive"
              >
                {stockStatus.label}
              </Badge>
            )}
          </div>
        </Card>
      </Link>

      <div className="flex-1 space-y-3">
        {/* Category */}
        {showCategory && product.category_name && (
          <div>
            <Link
              className="font-medium text-xs tracking-widest uppercase hover:underline"
              href={`/catalog?category=${product.category_name.toLowerCase()}`}
              style={{
                color:
                  product.category_color ||
                  PRODUCT_CARD_CONFIG.DEFAULT_CATEGORY_COLOR,
              }}
            >
              {product.category_name}
            </Link>
          </div>
        )}

        {/* Product Name */}
        <div>
          <Link
            className="text-2xl font-semibold text-foreground hover:underline line-clamp-2"
            href={`/catalog/product/${product.slug}`}
          >
            {product.name}
          </Link>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          {lowestPrice ? (
            <p className="text-2xl font-semibold text-foreground">
              {lowestPrice.formatted}
            </p>
          ) : (
            <p className="text-2xl font-semibold text-muted-foreground">
              Price unavailable
            </p>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div
            className="text-muted-foreground line-clamp-3 pt-2 prose prose-sm max-w-none [&>*]:line-clamp-3 [&>*]:overflow-hidden [&>*]:text-ellipsis [&>*]:-webkit-line-clamp-3 [&>*]:-webkit-box [&>*]:-webkit-box-orient-vertical"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}
      </div>

      {/* Action Button */}
      <div className="mt-6">
        {inStock ? (
          <Button
            className="max-w-[140px] py-2 text-sm font-medium rounded-full"
            asChild
          >
            <Link href={`/catalog/product/${product.slug}`}>Subscribe</Link>
          </Button>
        ) : (
          <Button
            className="max-w-[140px] py-2 text-sm font-medium rounded-full bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
            disabled
          >
            Out of Stock
          </Button>
        )}
      </div>
    </div>
  );
}
