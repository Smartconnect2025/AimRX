"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useCart } from "../hooks/useCart";
import { CartIcon } from "./CartIcon";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CheckoutButton } from "./CheckoutButton";
import { CART_MESSAGES } from "../constants";

export function CartDrawer() {
  const { items, removeItem, getTotalAmount } = useCart();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const subtotal = getTotalAmount();
  const hasOutOfStock = items.some(
    (item) => !item.stock_quantity || item.stock_quantity <= 0,
  );

  const handleRemoveItem = (id: number) => {
    removeItem(id);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div aria-label="Open cart">
          <CartIcon />
        </div>
      </SheetTrigger>

      <SheetClose ref={closeButtonRef} className="hidden" />

      <SheetContent className="flex w-full flex-col sm:max-w-xl bg-white p-4 md:p-6">
        <SheetHeader className="space-y-2.5 pr-6 mb-4">
          <SheetTitle className="text-2xl font-medium">Cart</SheetTitle>
        </SheetHeader>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-slate-500">{CART_MESSAGES.CART_EMPTY}</p>
            </div>
          ) : (
            <div className="space-y-6 pr-6">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="space-y-4 pr-6">
            <CartSummary subtotal={subtotal} />

            <CheckoutButton
              isDisabled={hasOutOfStock}
              onCloseCart={() => closeButtonRef.current?.click()}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
