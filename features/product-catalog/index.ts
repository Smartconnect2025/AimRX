// Main components
export { ProductCatalogPage } from "./components/ProductCatalogPage";
export { CategoryPage } from "./components/CategoryPage";
export { ProductCard } from "./components/product/ProductCard";
export { ProductGrid } from "./components/ProductGrid";

// Category components
export { CategoryHeader } from "./components/category/CategoryHeader";
export { CategoryFilter } from "./components/category/CategoryFilter";

// Layout components
export { ProductSkeleton } from "./components/layout/ProductSkeleton";

// Product Detail Components
export { ProductDetailPage } from "./components/product-detail/ProductDetailPage";
export { ProductHero } from "./components/product-detail/ProductHero";
export { ProductActions } from "./components/product-detail/ProductActions";
export { ProductFAQ } from "./components/product-detail/ProductFAQ";
export { BackButton } from "./components/product-detail/BackButton";

// Hooks
export { useProductCatalog } from "./hooks/use-product-catalog";
export { useProductCatalogSupabase } from "./hooks/use-product-catalog-supabase";
export { useCategoryFilter } from "./hooks/use-category-filter";
export {
  useStripePrices,
  useProductStripePrices,
} from "./hooks/use-stripe-prices";
export { useProductDetail } from "./hooks/use-product-detail";

// Services
export { productService } from "./services/productService";
export { stripePriceApiService } from "./services/stripe-price-service.client";
export { stripePriceServiceServer } from "./services/stripe-price-service.server";

// Types
export type {
  Product,
  ProductCardProps,
  Category,
  StripePriceInfo,
} from "./types";

// Utils and constants
export {
  formatSubscriptionPrice,
  isProductInStock,
  getStockStatus,
} from "./utils";
export { PRODUCT_CARD_CONFIG } from "./constants";

// No mock data exports - all data comes from database
