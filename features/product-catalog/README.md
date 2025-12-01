# Product Catalog Feature

## Overview

The Product Catalog feature provides a comprehensive e-commerce product browsing experience with
category filtering, search functionality, and responsive design. It's designed to support
subscription-based pricing models and includes advanced filtering capabilities.

## Features

- **Product Grid**: Responsive 2-column layout for product display
- **Category Filtering**: Dynamic category-based filtering with URL parameter management
- **Search Functionality**: Real-time product search
- **Stock Management**: In-stock filtering and stock status indicators
- **Subscription Pricing**: Support for monthly subscription pricing with discounts
- **Loading States**: Skeleton loading animations
- **Error Handling**: Comprehensive error states and retry functionality
- **Mobile Responsive**: Mobile-first design with collapsible filters

## Components

### Main Components

- **`ProductCatalogPage`**: Main catalog page with search, filters, and product grid
- **`CategoryPage`**: Category-specific product listing with category hero section
- **`ProductCard`**: Individual product display card with pricing and actions
- **`ProductGrid`**: Responsive grid layout for products

### Category Components

- **`CategoryHeader`**: Hero section for category pages
- **`CategoryFilter`**: Sidebar category navigation with product counts

### Layout Components

- **`ProductSkeleton`**: Loading state component for product cards

## Hooks

### `useProductCatalog`

Main hook for product data management and filtering.

```tsx
const { products, categories, loading, error, refetch, applyFilters, clearFilters } =
  useProductCatalog({
    filters: {
      category_id: 1,
      search_query: "vitamin",
      in_stock_only: true,
    },
  });
```

### `useCategoryFilter`

Hook for category filtering with URL parameter management.

```tsx
const { categories, selectedCategory, setSelectedCategory, isActive, clearSelection } =
  useCategoryFilter();
```

## Types

### Core Types

```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  slug: string;
  image_url: string;
  category_id: number;
  category_name?: string;
  category_color?: string;
  stock_quantity: number;
  subscription_price: number; // in cents
  subscription_price_discounted?: number;
  is_best_seller?: boolean;
  benefits?: string;
  active_ingredient?: string;
  created_at: Date;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  image_url?: string;
  product_count: number;
}
```

## Usage

### Basic Usage

```tsx
import { ProductCatalogPage } from "@/features/product-catalog";

export default function CatalogPage() {
  return <ProductCatalogPage />;
}
```

### Category Page

```tsx
import { CategoryPage, getCategoryBySlug, getProductsByCategory } from "@/features/product-catalog";

export default async function CategoryPageRoute({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const products = getProductsByCategory(category.id);

  return <CategoryPage category={category} products={products} />;
}
```

### Individual Product Card

```tsx
import { ProductCard } from "@/features/product-catalog";

<ProductCard product={product} showCategory={true} className="custom-class" />;
```

## Utilities

### Price Formatting

```tsx
import {
  formatPrice,
  formatSubscriptionPrice,
  calculateDiscount,
} from "@/features/product-catalog";

const price = formatPrice(12900); // "$129.00"
const subscriptionPrice = formatSubscriptionPrice(12900); // "$129.00/mo"
const discount = calculateDiscount(12900, 9900); // 23
```

### Product Filtering

```tsx
import { filterProducts, isProductInStock, getStockStatus } from "@/features/product-catalog";

const filteredProducts = filterProducts(products, {
  category_id: 1,
  search_query: "vitamin",
  in_stock_only: true,
});
```

## Mock Data

The feature includes comprehensive mock data for development:

- **6 sample products** with realistic data
- **4 categories** with different themes
- **Helper functions** for data retrieval

```tsx
import {
  mockProducts,
  mockCategories,
  getProductById,
  getCategoryBySlug,
} from "@/features/product-catalog";
```

## Styling

The component uses a gradient background design inspired by modern e-pharmacy interfaces:

- **Product cards**: Light blue gradient background (`#CADEFF` to `#FFF`)
- **Category colors**: Dynamic color theming based on category
- **Typography**: Clean, modern typography with proper hierarchy
- **Responsive design**: Mobile-first approach with breakpoints

## Constants

Key configuration constants:

```tsx
const PRODUCT_CARD_CONFIG = {
  DEFAULT_IMAGE: "/images/placeholder.webp",
  GRADIENT_BACKGROUND: "linear-gradient(298deg, #CADEFF 49.51%, #FFF 116.51%)",
  DEFAULT_CATEGORY_COLOR: "#3B82F6",
};
```

## Routes

- `/catalog` - Main product catalog page
- `/catalog/category/[slug]` - Category-specific product listing

## Backend Integration

✅ **Supabase Backend Implemented**

The feature now includes full Supabase integration with:

### Database Schema

- **products** - Core product information with healthcare-specific fields
- **categories** - Product categories with visual styling
- **product_inventory** - Separate inventory tracking for performance

### Security Model

- **Role-based Access** - Authenticated users can read, admin users can write, enforced at the
  server application layer
- **Admin Operations** - Complete CRUD operations for product management

### Usage

```tsx
// Automatic Supabase integration (default)
const { products, loading } = useProductCatalog();

// Fallback to mock data for development
const { products, loading } = useProductCatalog({ useSupabase: false });

// Admin operations
import { productService } from "@features/product-catalog";
await productService.createProduct({...});
```

## Performance Considerations

- **Server Components**: Category pages use server-side rendering for SEO
- **Image Optimization**: Next.js Image component with proper sizing
- **Lazy Loading**: Products load progressively
- **Skeleton States**: Smooth loading experience
- **Memoization**: Efficient re-rendering with React hooks

## Accessibility

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color combinations
- **Focus Management**: Clear focus indicators

## Testing

The feature is designed to be easily testable with:

- **Mock data**: Consistent test data
- **Error simulation**: Built-in error states for testing
- **Loading states**: Predictable loading behavior
- **Component isolation**: Each component can be tested independently

## Future Enhancements

Potential areas for expansion:

- **Product comparison**: Side-by-side product comparison
- **Wishlist functionality**: Save products for later
- **Advanced filtering**: Price ranges, ratings, ingredients
- **Sort options**: Price, popularity, alphabetical
- **Infinite scroll**: Load more products on scroll
- **Product reviews**: Customer reviews and ratings
