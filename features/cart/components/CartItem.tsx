"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";
import type { CartItemProps } from "../types";

export function CartItem({ item, onRemove }: CartItemProps) {
  const isOutOfStock = !item.stock_quantity || item.stock_quantity <= 0;

  // Get the selected price from the cart item
  const selectedPrice = item.selectedPrice;
  const itemPrice = selectedPrice
    ? selectedPrice.formatted
    : "Price unavailable";

  // Determine the subscription type display
  const getSubscriptionTypeDisplay = () => {
    if (!selectedPrice) return "Price unavailable";
    if (selectedPrice.isSubscription) {
      switch (selectedPrice.interval) {
        case "month":
          return "Month to month";
        case "quarter":
          return "Every 3 months";
        case "year":
          return "Yearly";
        default:
          return "Subscription";
      }
    }
    return "One-time purchase";
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 border-b border-slate-200 pb-6",
        isOutOfStock && "opacity-50",
      )}
    >
      {/* Product Image */}
      <div className="h-16 w-16 flex-shrink-0">
        <Image
          src={item.image_url || "/images/placeholder.webp"}
          alt={item.name}
          className="w-full h-full object-cover rounded-md"
          width={64}
          height={64}
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-medium text-slate-900 pb-1">{item.name}</h4>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">
                {getSubscriptionTypeDisplay()}
              </p>
              <p className="font-medium text-slate-900">{itemPrice}</p>
            </div>
            {/* Benefits field removed - now managed by Stripe product details */}
          </div>

          {/* Remove Button */}
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-slate-300 text-slate-700 hover:border-slate-400 py-2 px-3 hover:bg-slate-50"
            onClick={() => onRemove(item.id)}
          >
            Remove
          </Button>
        </div>

        {/* Out of Stock Warning */}
        {isOutOfStock && (
          <p className="mt-2 text-sm text-red-600">This item is out of stock</p>
        )}
      </div>
    </div>
  );
}
