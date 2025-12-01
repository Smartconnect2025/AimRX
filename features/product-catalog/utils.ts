/**
 * Format price from cents to dollar string
 */
export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

/**
 * Format subscription price with interval suffix
 */
export function formatSubscriptionPrice(
  priceInCents: number,
  interval?: string,
): string {
  const basePrice = formatPrice(priceInCents);
  return interval ? `${basePrice}/${interval}` : basePrice;
}

/**
 * Check if product is in stock
 */
export function isProductInStock(stockQuantity: number): boolean {
  return stockQuantity > 0;
}

/**
 * Get stock status with color coding
 */
export function getStockStatus(stockQuantity: number): {
  status: "in-stock" | "low-stock" | "out-of-stock";
  label: string;
  color: string;
} {
  if (stockQuantity === 0) {
    return { status: "out-of-stock", label: "Out of Stock", color: "#EF4444" };
  } else if (stockQuantity <= 5) {
    return { status: "low-stock", label: "Low Stock", color: "#F59E0B" };
  } else {
    return { status: "in-stock", label: "In Stock", color: "#10B981" };
  }
}

import { Product } from "./types";

/**
 * Filter products by various criteria
 */
export function filterProducts(
  products: Product[],
  filters: {
    category_id?: number;
    search_query?: string;
    in_stock_only?: boolean;
  },
) {
  return products.filter((product) => {
    // Category filter
    if (filters.category_id && product.category_id !== filters.category_id) {
      return false;
    }

    // Search filter
    if (filters.search_query) {
      const query = filters.search_query.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesDescription =
        product.description?.toLowerCase().includes(query) || false;
      if (!matchesName && !matchesDescription) {
        return false;
      }
    }

    // Stock filter
    if (filters.in_stock_only && !isProductInStock(product.stock_quantity)) {
      return false;
    }

    return true;
  });
}
