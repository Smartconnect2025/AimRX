"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartState, CartItem, SubscriptionType } from "../types";
import {
  calculateCartTotal,
  formatCartTotal,
  getCartItemPrice,
  canAddToCart,
  updateCartCookies,
} from "../utils";
import { CART_CONFIG } from "../constants";

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      items: [],
      subscriptionType: "monthly" as SubscriptionType,
      _hasHydrated: false,

      addItem: (product: CartItem) => {
        const currentItems = get().items;

        // Check if item already exists
        const existingItem = currentItems.find(
          (item) => item.id === product.id,
        );
        if (existingItem) {
          return false; // Item already in cart
        }

        // Validate if product can be added (including subscription interval validation)
        const validation = canAddToCart(
          product,
          currentItems,
          product.selectedPrice,
        );
        if (!validation.canAdd) {
          return false;
        }

        // Check max items limit
        if (currentItems.length >= CART_CONFIG.MAX_ITEMS) {
          return false;
        }

        const newItems = [...currentItems, product];
        set({ items: newItems });

        // Update cookies
        updateCartCookies(newItems);

        // Dispatch event for UI updates
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }

        return true;
      },

      removeItem: (id: number) => {
        const currentItems = get().items;
        const newItems = currentItems.filter((item) => item.id !== id);

        set({ items: newItems });

        // Update cookies
        updateCartCookies(newItems);

        // Check if there are no more weight loss medications and clear questionnaire
        const hasWeightLossMedications = newItems.some(
          (item) => item.category_name === "WEIGHT LOSS",
        );
        if (!hasWeightLossMedications && typeof window !== "undefined") {
          localStorage.removeItem("questionnaireCompleted");
          localStorage.removeItem("questionnaireData");
        }

        // Dispatch event for UI updates
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }
      },

      clearCart: () => {
        set({ items: [] });

        // Clear cookies
        updateCartCookies([]);

        // Clear questionnaire completion flag since cart is empty
        if (typeof window !== "undefined") {
          localStorage.removeItem("questionnaireCompleted");
          localStorage.removeItem("questionnaireData");
        }

        // Dispatch event for UI updates
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }
      },

      updateSubscriptionType: (type: SubscriptionType) => {
        set({ subscriptionType: type });
      },

      getTotalAmount: () => {
        const items = get().items;
        const totalInCents = calculateCartTotal(items);
        return formatCartTotal(totalInCents);
      },

      getItemCount: () => {
        return get().items.length;
      },

      getItemPrice: (cartItem: CartItem) => {
        return getCartItemPrice(cartItem);
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({
          _hasHydrated: hasHydrated,
        });
      },
    }),
    {
      name: CART_CONFIG.STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Update cookies when store is rehydrated
            updateCartCookies(state.items);
            state.setHasHydrated(true);

            // Dispatch event for UI updates
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("cart-updated"));
            }
          }
        };
      },
    },
  ),
);
