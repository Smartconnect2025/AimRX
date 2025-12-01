"use client";

import { ShoppingCart } from "lucide-react";
import { cn } from "@/utils/tailwind-utils";
import { useCart } from "../hooks/useCart";
import type { CartIconProps } from "../types";

export function CartIcon({ className }: CartIconProps) {
  const { items } = useCart();
  const itemCount = items.length;

  return (
    <div
      className={cn(
        "relative h-10 w-10 p-0 flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:text-foreground rounded-full transition-colors",
        className,
      )}
    >
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border-2 border-background">
          {itemCount}
        </span>
      )}
    </div>
  );
}
