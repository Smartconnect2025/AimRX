export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string; // Nullable in schema
  color?: string; // Nullable in schema
  image_url?: string; // Nullable in schema
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  product_count: number; // Computed field
}

export interface Product {
  id: number;
  name: string;
  description?: string; // Nullable in schema
  slug: string;
  image_url?: string; // Nullable in schema
  category_id: number;
  category_name?: string; // Optional since it comes from JOIN
  category_color?: string; // Optional since it comes from JOIN
  stock_quantity: number;
  low_stock_threshold: number;
  subscription_price: number; // Price in cents
  subscription_price_discounted?: number; // Discounted price in cents
  is_active: boolean;
  is_best_seller: boolean;
  requires_prescription: boolean;
  benefits?: string;
  active_ingredient?: string;
  safety_info?: string;
  created_at: Date;
  updated_at: Date;
}
