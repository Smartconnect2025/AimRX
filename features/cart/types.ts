import type {
  Product,
  StripePriceInfo,
} from "@/features/product-catalog/types";

export interface CartItem extends Product {
  selectedPrice?: StripePriceInfo;
}

export type SubscriptionType = "monthly";

export interface CartState {
  items: CartItem[];
  subscriptionType: SubscriptionType;
  addItem: (product: CartItem) => boolean;
  removeItem: (id: number) => void;
  clearCart: () => void;
  updateSubscriptionType: (type: SubscriptionType) => void;
  getTotalAmount: () => string;
  getItemCount: () => number;
  getItemPrice: (cartItem: CartItem) => string;
  setHasHydrated: (hasHydrated: boolean) => void;
  _hasHydrated: boolean;
}

export interface CartIconProps {
  className?: string;
}

export interface CartItemProps {
  item: CartItem;
  onRemove: (id: number) => void;
}

export interface CartSummaryProps {
  subtotal: string;
}

export interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
  className?: string;
  selectedPrice?: StripePriceInfo;
}
