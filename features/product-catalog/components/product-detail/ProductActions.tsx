"use client";

import { useState } from "react";
import { AddToCartButton } from "@/features/cart";
import { Button } from "@/components/ui/button";
import type { Product, StripePriceInfo } from "../../types";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const isOutOfStock = !product.stock_quantity || product.stock_quantity <= 0;
  const [selectedPrice, setSelectedPrice] = useState<StripePriceInfo | null>(
    product.stripe_prices?.[0] || null,
  );

  // Group prices by type (one-time vs subscription)
  const oneTimePrices =
    product.stripe_prices?.filter((p) => !p.isSubscription) || [];
  const subscriptionPrices =
    product.stripe_prices?.filter((p) => p.isSubscription) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Price Display */}
      {selectedPrice ? (
        <p className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white flex items-center gap-3 mb-2">
          {selectedPrice.formatted}
        </p>
      ) : (
        <p className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white/60 flex items-center gap-3 mb-2">
          Price unavailable
        </p>
      )}

      {/* No Pricing Available Message */}
      {(!product.stripe_prices || product.stripe_prices.length === 0) && (
        <div className="mt-4 sm:mt-6">
          <p className="text-white/80 text-sm sm:text-base">
            Pricing information is being loaded. Please sync this product to
            Stripe to view pricing options.
          </p>
        </div>
      )}

      {/* One-time Purchase Options */}
      {oneTimePrices.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h3 className="text-white text-sm sm:text-base font-medium mb-3">
            One-time Purchase:
          </h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {oneTimePrices.map((price) => (
              <Button
                key={price.id}
                variant={selectedPrice?.id === price.id ? "default" : "outline"}
                onClick={() => setSelectedPrice(price)}
                className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all"
                style={
                  selectedPrice?.id === price.id
                    ? { backgroundColor: "white", color: "black" }
                    : {
                        backgroundColor: "transparent",
                        color: "white",
                        borderColor: "white",
                      }
                }
              >
                {price.formatted}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Options */}
      {subscriptionPrices.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h3 className="text-white text-sm sm:text-base font-medium mb-3">
            Subscription Options:
          </h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {subscriptionPrices.map((price) => (
              <Button
                key={price.id}
                variant={selectedPrice?.id === price.id ? "default" : "outline"}
                onClick={() => setSelectedPrice(price)}
                className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all"
                style={
                  selectedPrice?.id === price.id
                    ? { backgroundColor: "white", color: "black" }
                    : {
                        backgroundColor: "transparent",
                        color: "white",
                        borderColor: "white",
                      }
                }
              >
                {price.formatted}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Subscribe Button */}
      <div className="flex items-center">
        <AddToCartButton
          product={product}
          disabled={isOutOfStock || !selectedPrice}
          selectedPrice={selectedPrice || undefined}
        />
      </div>

      {/* Cancellation Policy */}
      {selectedPrice?.isSubscription && (
        <p className="text-white/80 text-xs sm:text-sm lg:text-base mt-4 leading-relaxed">
          You can cancel at any time! Just make sure to cancel at least 14 days
          before your next billing cycle to avoid being charged for the upcoming
          period.
        </p>
      )}
    </div>
  );
}
