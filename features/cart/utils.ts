import type {
  Product,
  StripePriceInfo,
} from "@/features/product-catalog/types";
import type { CartItem } from "./types";
import type { StripeCartItem } from "@/features/stripe/types";
import { formatPrice } from "@/features/product-catalog/utils";

/**
 * Calculate the total price of cart items
 * Note: This now works with Stripe pricing from selectedPrice
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    // Use the selected price if available, otherwise return 0
    const price = item.selectedPrice?.amount || 0;
    return total + price;
  }, 0);
}

/**
 * Format cart total for display
 */
export function formatCartTotal(totalInCents: number): string {
  return formatPrice(totalInCents);
}

/**
 * Get the display price for a cart item
 * Note: This now works with Stripe pricing from selectedPrice
 */
export function getCartItemPrice(cartItem: CartItem): string {
  const price = cartItem.selectedPrice;
  return price ? price.formatted : "Price unavailable";
}

/**
 * Check if product is already in cart
 */
export function isProductInCart(items: Product[], productId: number): boolean {
  return items.some((item) => item.id === productId);
}

/**
 * Get subscription interval from a cart item
 */
function getCartItemInterval(item: CartItem): string | null {
  if (!item.selectedPrice?.isSubscription) {
    return null; // One-time purchase
  }
  return item.selectedPrice.interval || null;
}

/**
 * Validate subscription interval combinations
 * Allowed combinations:
 * - Multiple one-time purchases
 * - Multiple subscriptions with identical billing intervals
 * - Mix of one-time purchases + subscriptions (single interval type)
 * Blocked combinations:
 * - Subscriptions with different intervals (monthly + annual = blocked)
 */
export function validateCartItemCombination(
  existingItems: CartItem[],
  newItem: CartItem,
): {
  canAdd: boolean;
  reason?: string;
} {
  const newItemInterval = getCartItemInterval(newItem);

  // If new item is one-time purchase, it's always allowed
  if (!newItemInterval) {
    return { canAdd: true };
  }

  // Get all subscription intervals from existing items
  const existingIntervals = existingItems
    .map(getCartItemInterval)
    .filter((interval): interval is string => interval !== null);

  // If no existing subscriptions, new subscription is allowed
  if (existingIntervals.length === 0) {
    return { canAdd: true };
  }

  // Check if new interval conflicts with existing intervals
  const hasConflictingInterval = existingIntervals.some(
    (interval) => interval !== newItemInterval,
  );

  if (hasConflictingInterval) {
    const conflictingInterval = existingIntervals.find(
      (interval) => interval !== newItemInterval,
    );
    return {
      canAdd: false,
      reason: `Unable to add ${newItem.name} as we cannot mix ${newItemInterval} and ${conflictingInterval} subscriptions.`,
    };
  }

  return { canAdd: true };
}

/**
 * Validate if product can be added to cart
 */
export function canAddToCart(
  product: Product,
  existingItems: CartItem[] = [],
  selectedPrice?: StripePriceInfo,
): {
  canAdd: boolean;
  reason?: string;
} {
  if (!product.stock_quantity || product.stock_quantity <= 0) {
    return { canAdd: false, reason: "Out of stock" };
  }

  // Create a cart item for validation
  const cartItem: CartItem = {
    ...product,
    selectedPrice,
  };

  // Validate subscription interval combinations
  const intervalValidation = validateCartItemCombination(
    existingItems,
    cartItem,
  );
  if (!intervalValidation.canAdd) {
    return intervalValidation;
  }

  return { canAdd: true };
}

/**
 * Convert cart items to Stripe checkout items
 */
export function convertCartItemsToStripeItems(
  items: CartItem[],
): StripeCartItem[] {
  return items.map((item) => {
    if (!item.selectedPrice) {
      throw new Error(`No selected price for item: ${item.name}`);
    }

    return {
      price: item.selectedPrice.id,
      quantity: 1, // Cart items are always quantity 1
      adjustable_quantity: {
        enabled: false, // Disable quantity adjustment in checkout
      },
    };
  });
}

/**
 * Update cart cookies for server-side access
 */
export function updateCartCookies(items: CartItem[]): void {
  if (typeof window === "undefined") return;

  const productNames = items.map((item) => item.name);

  if (items.length > 0) {
    // Store product names in cookie for 30 days
    document.cookie = `cartProducts=${JSON.stringify(productNames)}; max-age=${
      30 * 24 * 60 * 60
    }; path=/`;
  } else {
    // Remove cookie when cart is empty
    document.cookie = "cartProducts=; max-age=0; path=/";
  }
}
