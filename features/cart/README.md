# Cart Feature

## Overview

The cart feature provides shopping cart functionality for the e-pharmacy application, including
product management, subscription handling, and persistent storage.

## Components

- **CartDrawer**: Main cart interface with sliding panel
- **CartIcon**: Shopping cart icon with item count badge
- **CartItem**: Individual product display in cart
- **CartSummary**: Cart totals and billing information
- **AddToCartButton**: Smart button for adding products to cart

## Key Features

- **Persistent Storage**: Uses Zustand with localStorage persistence
- **Subscription Management**: Handles monthly subscription pricing
- **Stock Validation**: Manages out-of-stock scenarios
- **Real-time Updates**: Event-driven UI synchronization
- **Toast Notifications**: User feedback for cart actions

## Usage

```tsx
import { CartDrawer, useCart, AddToCartButton } from "@/features/cart";

// In header
<CartDrawer />

// In product pages
<AddToCartButton product={product} />

// Access cart state
const { items, addItem, removeItem, getTotalAmount } = useCart();
```

## State Management

The cart uses Zustand for state management with the following key methods:

- `addItem(product)`: Add product to cart
- `removeItem(id)`: Remove product from cart
- `clearCart()`: Empty the cart
- `getTotalAmount()`: Calculate cart total
- `getItemCount()`: Get number of items in cart
