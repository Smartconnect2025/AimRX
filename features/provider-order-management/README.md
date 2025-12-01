# Provider Order Management

This feature provides a comprehensive dashboard for healthcare providers to manage and review patient orders requiring medical approval.

## Features

- **Order Dashboard**: View all orders requiring provider review
- **Licensed State Filtering**: Automatically filters orders by provider's licensed state
- **Search & Filtering**: Search by patient name, order number, or date
- **Responsive Design**: Desktop table view and mobile card view
- **Pagination**: Efficient handling of large order datasets
- **Status Management**: Color-coded order statuses and review controls

## Components

### Main Components
- `ProviderOrderDashboard.tsx` - Main dashboard interface
- `OrderTable.tsx` - Desktop table view for orders
- `OrderCard.tsx` - Mobile card view for orders
- `SearchBar.tsx` - Search and filter interface
- `LicensedStateAlert.tsx` - Provider license state notification
- `OrderPagination.tsx` - Pagination controls

### Hooks
- `useProviderOrders.ts` - Manages order data and state
- `useOrderFilters.ts` - Handles search and filtering logic

### Services
- `providerOrderService.ts` - API calls and data fetching

## Usage

### Basic Setup

1. Import and use the ProviderOrderDashboard component:
```tsx
import { ProviderOrderDashboard } from "@/features/provider-order-management";

export default function ProviderPage() {
  return <ProviderOrderDashboard />;
}
```

### Data Flow

1. Provider authentication via existing auth system
2. Automatic licensed state detection and filtering
3. Order fetching with search and pagination
4. Real-time updates via Supabase subscriptions

## Order Statuses

- **Order Placed**: New orders awaiting review
- **Order Deactivated**: Cancelled or deactivated orders
- **Provider Approved**: Orders approved by provider
- **Provider Rejected**: Orders rejected by provider

## Search Functionality

The search supports:
- Patient names (first and last)
- Order numbers (exact match)
- Order dates (MM/DD/YYYY format)
- General text search across all fields

## Mobile Responsiveness

- Desktop: Full table view with all columns
- Mobile: Card-based layout with key information
- Touch-friendly buttons and interactions

## Security

- Provider authentication required
- Orders filtered by provider's licensed state only
- No access to orders outside licensed jurisdiction
- Secure API endpoints with proper authorization

## Future Enhancements

- Individual order review pages
- Order status update functionality
- Advanced filtering options
- Export capabilities
- Real-time notifications 