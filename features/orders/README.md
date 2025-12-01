# Orders Feature

Frontend-only orders management system for the TFA Components Foundation e-pharmacy application.

## Overview

This feature provides comprehensive order history and tracking functionality, allowing users to view their past orders, track status updates, manage subscriptions, and handle cancellations. All data is currently stored in localStorage as mock data, with hooks designed for easy backend integration.

## Components

### Pages
- `OrdersPage` - Main orders list view with responsive design (desktop table + mobile cards)
- `OrderDetailPage` - **Enhanced** individual order details with professional layout, subscription management, and comprehensive information display

### UI Components
- `OrderTable` - Desktop table view of orders
- `OrderCard` - Mobile card view for individual orders
- `OrderStatusBadge` - Status indicator with color-coded styling
- `ActivityTimeline` - Chronological order progress timeline (legacy)
- `BackButton` - Navigation component for returning to previous page

### Enhanced Order Detail Components
- `ActivityTimelineCard` - **New** professional timeline display in dedicated card layout
- `OrderBreadcrumb` - **New** breadcrumb navigation (Orders > Order #12345)
- `AddressesCard` - **New** side-by-side shipping and billing address display
- `SubscriptionStatusCard` - **New** comprehensive subscription management section
- `OrderItemsTable` - **New** enhanced order items with product images and improved styling
- `CancelSubscriptionDialog` - **New** subscription cancellation workflow with policy information

### Hooks
- `useOrders` - Manages orders list, pagination, and loading states
- `useOrderDetail` - Fetches and manages individual order data

## Enhanced Features

### Order Detail Page Improvements
Following the temp-erx reference implementation, the Order Detail page now includes:

#### **Professional Layout**
- **Two-column responsive grid**: Left column (2/3 width) for main content, right column (1/3 width) for activity timeline
- **Breadcrumb navigation**: Clear navigation path (Orders > Order #12345)
- **Enhanced header**: Larger typography, better spacing, formatted timestamps
- **Card-based design**: Each section in its own card for better visual separation

#### **Subscription Management**
- **Active/Inactive status indicators**: Visual green/red dots with clear status labels
- **Subscription cancellation**: Full cancellation workflow with policy enforcement
- **Cancellation policies**: 14-day billing cycle policy enforcement
- **Payment method display**: Masked credit card information
- **Next billing date calculation**: Automatic 30-day billing cycle tracking

#### **Enhanced Order Information**
- **Product images**: Display product images in order items table (with fallback gradients)
- **Side-by-side addresses**: Shipping and billing addresses in organized layout
- **Professional activity timeline**: Improved timeline with proper date/time formatting
- **Detailed pricing**: Clear subscription pricing with /mo indicators

#### **Interactive Features**
- **Subscription cancellation dialog**: AlertDialog-based cancellation flow
- **Loading states**: Professional loading and error handling
- **Real-time updates**: localStorage updates for cancellation requests
- **Responsive design**: Optimized for all screen sizes

### Subscription Lifecycle Management
1. **Active Subscriptions**: Show management options and next billing info
2. **Cancellation Requests**: Track and display pending cancellations
3. **Policy Enforcement**: 14-day cancellation policy with clear messaging
4. **Status Tracking**: Visual indicators for subscription health

## Usage

### Basic Implementation
```tsx
import { OrdersPage, OrderDetailPage } from "@/features/orders";

// Orders list page
<OrdersPage />

// Enhanced order detail page
<OrderDetailPage orderId="12345" />
```

### Subscription Management
```tsx
import { CancelSubscriptionDialog, SubscriptionStatusCard } from "@/features/orders";

// Standalone subscription status display
<SubscriptionStatusCard order={order} />

// Subscription cancellation dialog
<CancelSubscriptionDialog order={order} />
```

### Enhanced Components Usage
```tsx
import { 
  OrderBreadcrumb, 
  AddressesCard, 
  OrderItemsTable, 
  ActivityTimelineCard 
} from "@/features/orders";

// Individual enhanced components
<OrderBreadcrumb orderId="12345" />
<AddressesCard order={order} />
<OrderItemsTable order={order} />
<ActivityTimelineCard order={order} />
```

## Data Structure

### Enhanced Order Types
```typescript
interface PaymentDetails {
  subscription_type: "monthly" | "discounted";
  cardholderName: string;
  last4: string;
  requested_cancel?: boolean; // New: Tracks cancellation requests
}

interface Order {
  // ... existing fields
  payment_details?: PaymentDetails;
}
```

### Mock Data Enhancement
The mock data now includes:
- Multiple orders with different statuses
- Progressive activity timelines
- Subscription cancellation examples
- Realistic payment details
- Various subscription types (monthly, discounted)

## Routes

- `/orders` - Orders list page
- `/orders/[id]` - **Enhanced** individual order detail page

## Order Status Flow

1. **Order Placed** - Initial order submission
2. **Provider Approved** - Medical provider approval (enables active subscription)
3. **Provider Rejected** - Medical provider rejection
4. **Handled by Pharmacy** - Order processed by pharmacy
5. **Order Deactivated** - Subscription cancelled/deactivated

## Subscription Management

### Subscription Status Detection
```typescript
// Enhanced logic considers payment details and cancellation status
const isActive = hasActiveSubscription(order);
const cancellationRequested = order.payment_details?.requested_cancel;
```

### Cancellation Workflow
1. **User initiates cancellation** via dialog
2. **Policy check**: 14-day billing cycle enforcement
3. **Confirmation dialog** with policy information
4. **Frontend simulation**: localStorage update
5. **Status update**: UI reflects pending cancellation

### Billing Cycle Management
- **Next billing calculation**: 30-day automatic cycles
- **Policy enforcement**: 14-day cancellation windows
- **Visual indicators**: Clear status and date displays

## UI/UX Enhancements

### Visual Design
- **Professional card layouts** with consistent spacing
- **Color-coded status indicators** for quick recognition
- **Product image integration** with elegant fallbacks
- **Typography hierarchy** for better readability

### Responsive Design
- **Desktop**: Two-column grid layout with optimal space usage
- **Mobile**: Single-column stack with preserved functionality
- **Tablet**: Adaptive layout that scales appropriately

### Interactive Elements
- **Hover states** on all interactive elements
- **Loading states** for all async operations
- **Error handling** with user-friendly messages
- **Toast notifications** for action feedback

## Backend Integration Points

The enhanced feature maintains easy backend integration:

### API Endpoints (Future)
- `GET /api/orders/:id` - Enhanced order details with subscription info
- `POST /api/subscriptions/:id/cancel` - Subscription cancellation
- `GET /api/subscriptions/:id/status` - Subscription status checks

### Database Schema Considerations
```sql
-- Enhanced orders table
ALTER TABLE orders ADD COLUMN payment_details JSONB;

-- Subscription cancellation tracking
CREATE TABLE subscription_cancellations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  requested_at TIMESTAMP,
  cancellation_date TIMESTAMP,
  policy_applied BOOLEAN
);
```

## Testing & Demo

### Mock Data Scenarios
1. **Recent Order**: "Order Placed" status with active subscription
2. **Approved Order**: Progressive timeline with discounted subscription
3. **Cancelled Subscription**: Shows completed cancellation flow

### Testing Subscription Features
```typescript
// Test cancellation flow
await cancelSubscription(order);

// Verify status updates
expect(order.payment_details.requested_cancel).toBe(true);

// Test policy enforcement
const nextBilling = getNextBillingDate(order.created_at);
const isWithin14Days = checkCancellationPolicy(nextBilling);
```

## Configuration

Enhanced configuration options in `constants.ts`:
- Subscription status styling
- Cancellation policy settings
- Payment method display formats
- Activity timeline styling

## Future Enhancements

### Immediate Opportunities
- **Subscription modification**: Plan changes and upgrades
- **Payment method updates**: Credit card management
- **Delivery tracking**: Integration with shipping providers
- **Automated renewals**: Smart billing cycle management

### Advanced Features
- **Subscription analytics**: Usage patterns and insights
- **Multi-product subscriptions**: Bundle management
- **Prorated billing**: Mid-cycle changes
- **Cancellation surveys**: Feedback collection

## Performance Considerations

- **Lazy loading**: Activity timeline and images
- **Memoization**: Expensive date calculations
- **State optimization**: Minimal re-renders
- **localStorage efficiency**: Optimized data storage

The enhanced Order Detail page provides a professional, comprehensive experience that matches modern e-commerce standards while maintaining the frontend-only approach and easy backend integration path. 