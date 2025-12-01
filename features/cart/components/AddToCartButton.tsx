"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@core/auth";
import { useCart } from "../hooks/useCart";
import { isProductInCart, canAddToCart } from "../utils";
import { CART_MESSAGES, CART_CONFIG } from "../constants";
import type { AddToCartButtonProps } from "../types";

export function AddToCartButton({
  product,
  disabled = false,
  className,
  selectedPrice,
}: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { items, addItem } = useCart();

  const isAlreadyInCart = isProductInCart(items, product.id);
  const validation = canAddToCart(product, items, selectedPrice);
  const isAtMaxCapacity = items.length >= CART_CONFIG.MAX_ITEMS;

  // Only disable for actual stock issues, not subscription conflicts
  // Subscription conflicts should show error toast when clicked
  const isDisabled =
    disabled ||
    !product.stock_quantity ||
    product.stock_quantity <= 0 ||
    isAlreadyInCart ||
    isAtMaxCapacity;

  const handleAddToCart = () => {
    if (isDisabled) return;

    // Check if user is authenticated
    if (!user) {
      // Redirect to login page with current page as redirect parameter
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/auth?redirect=${redirectUrl}`);
      return;
    }

    const cartItem = {
      ...product,
      selectedPrice,
    };
    const success = addItem(cartItem);

    if (success) {
      toast.success(CART_MESSAGES.ADDED_TO_CART, {
        description: `${product.name} has been added to your cart.`,
        duration: CART_CONFIG.TOAST_DURATION,
      });
    } else {
      // Handle different failure scenarios
      if (isAlreadyInCart) {
        toast.error(CART_MESSAGES.ALREADY_IN_CART, {
          description: `${product.name} is already in your cart.`,
          duration: CART_CONFIG.TOAST_DURATION,
        });
      } else if (!validation.canAdd) {
        // Show the specific validation error message (e.g., subscription interval conflict)
        toast.error("Cannot add to cart", {
          description:
            validation.reason || "This item cannot be added to cart.",
          duration: CART_CONFIG.TOAST_DURATION,
        });
      } else if (isAtMaxCapacity) {
        toast.error(CART_MESSAGES.MAX_ITEMS_REACHED, {
          description: `You can only have ${CART_CONFIG.MAX_ITEMS} items in your cart.`,
          duration: CART_CONFIG.TOAST_DURATION,
        });
      }
    }
  };

  const getButtonText = () => {
    if (!product.stock_quantity || product.stock_quantity <= 0)
      return "Out of Stock";
    if (isAlreadyInCart) return "Already in Cart";
    if (isAtMaxCapacity) return "Cart Full";
    return "Subscribe";
  };

  return (
    <Button
      className={cn(
        "bg-white text-slate-900 hover:bg-white/90 px-8 py-3 rounded-full font-medium",
        isDisabled &&
          "bg-gray-300 text-gray-500 hover:bg-gray-300 cursor-not-allowed",
        className,
      )}
      disabled={isDisabled}
      onClick={handleAddToCart}
    >
      {getButtonText()}
    </Button>
  );
}
