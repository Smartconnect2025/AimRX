// Import database schema types
import type {
  Product as DBProduct,
  Category as DBCategory,
} from "@/core/database/schema";

// Frontend Product interface extending database schema with proper date handling
export interface Product
  extends Omit<
    DBProduct,
    | "created_at"
    | "updated_at"
    | "subscription_price_discounted"
    | "benefits"
    | "active_ingredient"
    | "safety_info"
    | "subscription_price" // Remove local pricing - will come from Stripe
  > {
  created_at: Date; // Frontend uses Date objects
  updated_at: Date; // Frontend uses Date objects

  // Stripe integration fields
  stripe_product_id: string | null; // Stripe product ID
  stripe_price_ids: string | null; // JSON string for multiple subscription intervals

  // Additional computed fields from joins
  category_name?: string; // From category join
  category_color?: string; // From category join
  stock_quantity: number; // From inventory join

  // Real-time pricing from Stripe (computed)
  stripe_prices?: StripePriceInfo[]; // Fetched from Stripe API
  lowest_stripe_price?: StripePriceInfo; // Lowest price for display
}

// Stripe price information
export interface StripePriceInfo {
  id: string;
  amount: number; // in cents
  formatted: string; // formatted price
  interval?: "month" | "quarter" | "year";
  isSubscription: boolean;
}

// Frontend Category interface extending database schema
export interface Category
  extends Omit<DBCategory, "created_at" | "updated_at"> {
  created_at: Date; // Frontend uses Date objects
  updated_at: Date; // Frontend uses Date objects

  // Additional computed fields
  product_count: number; // Count of products in this category
}

// Define DBProductWithDetails locally since it doesn't exist in schema
type DBProductWithDetails = DBProduct & {
  category_name?: string;
  category_slug?: string;
};

// ProductWithDetails interface (from database view)
export interface ProductWithDetails
  extends Omit<DBProductWithDetails, "created_at" | "updated_at"> {
  created_at: Date; // Frontend uses Date objects
  updated_at: Date; // Frontend uses Date objects
}

export interface ProductFilters {
  category_id?: number;
  price_range?: [number, number];
  in_stock_only?: boolean;
  search_query?: string;
}

export interface ProductCardProps {
  product: Product;
  showCategory?: boolean;
  className?: string;
}

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  className?: string;
}

export interface CategoryPageProps {
  category: Category;
  products: Product[];
}

// Database operation types (re-export for CRUD operations)
export type {
  InsertProduct as CreateProductData,
  InsertCategory as CreateCategoryData,
  UpdateProduct as UpdateProductData,
  UpdateCategory as UpdateCategoryData,
} from "@/core/database/schema";
