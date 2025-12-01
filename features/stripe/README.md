# Stripe Integration Feature

This feature provides comprehensive Stripe payment integration for the application, including
checkout sessions, subscription management, and customer portal access.

## Overview

The Stripe feature handles:

- Product pricing from Stripe API
- Checkout session creation and management
- Subscription lifecycle management
- Customer portal integration
- Webhook handling for subscription events

## Architecture

This feature follows the established architecture pattern:

- **Services**: Business logic and Stripe API interactions
- **Hooks**: React hooks for client-side Stripe operations
- **Types**: TypeScript definitions for Stripe integration
- **Utils**: Helper functions for price formatting and validation
- **Components**: UI components for Stripe-related functionality

## Key Components

### Services

- `stripeService.ts` - Core Stripe API operations
- `checkoutService.ts` - Client-side checkout session creation
- `stripeCustomerService.ts` - Database operations for Stripe customers
- `stripeOrderService.ts` - Database operations for orders with Stripe integration and order
  activities
- `addressHelperService.ts` - Address management for Stripe orders

### Hooks

- `use-stripe.ts` - Client-side Stripe instance management and checkout redirection

### Types

- `types.ts` - Extended Stripe types for the application

## Usage

```typescript
// Import from the feature
import { useStripe, createCheckoutSessionClient } from "@/features/stripe";

// Use in components
const { stripe, loading } = useStripe();
const { redirectToCheckout } = useStripeCheckout();
```

## Environment Variables

Required environment variables:

- `STRIPE_SECRET_KEY` - Server-side Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Client-side publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret

## Integration Points

This feature integrates with:

- Product catalog for pricing information
- Order management for transaction records
- User management for customer creation
- Cart system for checkout session creation
