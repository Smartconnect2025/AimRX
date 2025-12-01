"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/utils/tailwind-utils";
import type { Product } from "@/features/product-catalog/types";

interface OrderSummaryProps {
  items: Product[];
  subtotal: number;
  className?: string;
}

export function OrderSummary({
  items,
  subtotal,
  className,
}: OrderSummaryProps) {
  return (
    <Card
      className={cn(
        "p-6 h-fit lg:sticky lg:top-8 rounded-lg shadow-sm border-gray-100",
        className,
      )}
    >
      <h2 className="text-xl font-semibold mb-6">Order summary</h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0"
          >
            <div className="h-16 w-16 rounded-md bg-gray-100 flex-shrink-0 flex items-center justify-center">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-md"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="w-8 h-8 bg-teal-500 rounded"></div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground">Month to month</p>
            </div>
            <div className="text-right">
              <p className="font-medium">
                {item.stripe_prices?.[0]?.formatted || "Price unavailable"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground">Total</span>
          <span className="font-semibold text-lg">${subtotal.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
