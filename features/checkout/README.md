# Checkout Feature

## Overview

The checkout feature provides a comprehensive frontend-only checkout experience for users to complete their medication orders. It includes shipping address management, payment details entry, billing address options, and order confirmation.

## Components

### Core Components

- **`CheckoutPage`**: Main component that orchestrates the entire checkout flow
- **`OrderSummary`**: Displays cart items and total pricing
- **`ShippingForm`**: Manages shipping address with edit functionality
- **`PaymentForm`**: Handles credit card information with formatting
- **`BillingForm`**: Optional billing address form with "same as shipping" option
- **`OrderConfirmation`**: Success page displayed after order completion

### Hooks

- **`useCheckout`**: Main hook that manages all checkout state and form validation

## Features

### Form Management
- React Hook Form integration with Zod validation
- Real-time input formatting (phone numbers, credit cards, expiry dates)
- Form validation with error messaging

### Address Management
- Pre-filled shipping address from mock user data
- Edit mode for shipping address
- Optional separate billing address
- US states dropdown selection

### Payment Processing
- Credit card number formatting (XXXX XXXX XXXX XXXX)
- Expiry date formatting (MM/YY)
- CVC validation
- Cardholder name validation

### Order Flow
- Cart integration with item display and totals
- Questionnaire completion check
- Mock order processing with loading states
- Order confirmation with success messaging
- Cart clearing after successful order

### Responsive Design
- Mobile-first layout
- Sticky order summary on desktop
- Grid-based responsive forms

## Integration Points

### Cart Integration
```typescript
import { useCart } from "@/features/cart/hooks/useCart";
// Access cart items, totals, and cart management
```

### Navigation
- Redirects to home if cart is empty
- Redirects to questionnaire if not completed
- Navigation to orders page and continue shopping

### State Management
- localStorage for demo order persistence
- Form state management with React Hook Form
- Loading states during order processing

## Mock Features (Frontend Only)

Since this is a frontend-only implementation:

- **Mock User Data**: Pre-filled with sample shipping information
- **Mock Order Processing**: 2-second delay to simulate API calls
- **Mock Success**: Random order ID generation
- **localStorage**: Used for demo state persistence

## Usage

### Basic Implementation
```typescript
import { CheckoutPage } from "@/features/checkout";

export default function Checkout() {
  return <CheckoutPage />;
}
```

### Custom Integration
```typescript
import { useCheckout, OrderSummary, ShippingForm } from "@/features/checkout";

function CustomCheckout() {
  const { forms, state, actions } = useCheckout();
  
  return (
    <div>
      <OrderSummary items={state.items} subtotal={state.subtotal} />
      <ShippingForm form={forms.shippingForm} />
      {/* Custom implementation */}
    </div>
  );
}
```

## Validation Schemas

The feature uses Zod schemas for form validation:

- **Shipping Address**: First name, last name, phone, address, city, state, postal code
- **Payment Details**: Cardholder name, card number (19 chars), expiry date (MM/YY), CVC (3-4 digits)
- **Billing Address**: Same fields as shipping address

## Future Backend Integration

When connecting to a backend:

1. Replace mock user data with real authentication
2. Replace mock order processing with real API calls
3. Integrate with payment processors
4. Add order persistence to database
5. Replace localStorage checks with real questionnaire status

## Dependencies

- `react-hook-form`: Form management
- `@hookform/resolvers/zod`: Form validation
- `zod`: Schema validation
- `sonner`: Toast notifications
- `lucide-react`: Icons
- `@/components/ui/*`: ShadCN UI components 