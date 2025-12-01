export const CART_CONFIG = {
  STORAGE_KEY: "tfa-cart",
  COOKIE_NAME: "cartProducts",
  COOKIE_EXPIRES_DAYS: 30,
  MAX_ITEMS: 10,
  TOAST_DURATION: 3000,
} as const;

export const CART_MESSAGES = {
  ADDED_TO_CART: "Added to cart",
  ALREADY_IN_CART: "Already in cart",
  REMOVED_FROM_CART: "Removed from cart",
  CART_CLEARED: "Cart cleared",
  OUT_OF_STOCK: "This item is out of stock",
  CART_EMPTY: "Your cart is empty",
  MAX_ITEMS_REACHED: "Maximum cart items reached",
} as const;

export const BILLING_INFO = {
  CANCELLATION_POLICY:
    "You can cancel at any time! Just make sure to cancel at least 14 days before your next billing cycle to avoid being charged for the upcoming period.",
} as const;
