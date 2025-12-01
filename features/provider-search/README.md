# Provider Search Feature

This feature provides a comprehensive search and filtering interface for finding healthcare
providers with real-time availability integration.

## Components

### Core Components

- `ProviderSearch`: Main component that orchestrates the search interface
- `ProviderCard`: Displays individual provider information with booking functionality
- `SearchFilters`: Advanced filtering system for providers

### Hooks

- `useProviderSearch`: Manages provider data fetching and filtering logic

### Utilities

- `getNextAvailableSlots`: Generates available appointment slots for providers
- `appointmentConflicts`: Handles appointment conflict detection
- `slotValidationService`: Validates slot availability before booking

## Usage

```tsx
import { ProviderSearch } from "@/features/provider-search";

// Basic usage
export default function ProvidersPage() {
  return <ProviderSearch />;
}

// With initial search and callback
export default function ProvidersPage() {
  return (
    <ProviderSearch
      initialSearchQuery="cardiologist"
      onBookingComplete={() => console.log("Booking completed")}
    />
  );
}
```

## Key Features

### 🔍 **Advanced Search & Filtering**

- **Text Search**: Search by provider name or specialty
- **Service Type Filtering**: Filter by telehealth and in-person appointments
- **Licensed State Filtering**: Filter providers by licensed states
- **Insurance Plan Filtering**: Filter by accepted insurance plans
- **Case-Insensitive Matching**: All filters work regardless of text case
- **Inclusive OR Logic**: Shows providers matching ANY selected criteria

### 📅 **Real-Time Availability Integration**

- **Available Slots Display**: Shows next 5 available appointment slots
- **Availability Status**: Real-time provider availability checking
- **Timezone Handling**: Automatic timezone conversion for appointments
- **Conflict Prevention**: Prevents double-booking and scheduling conflicts
- **Slot Validation**: Real-time validation before booking to ensure slot availability

### 💼 **Provider Information Display**

- **Professional Details**: Name, specialty, avatar, experience
- **Service Icons**: Visual indicators for available service types
- **Licensed States**: Geographic coverage information
- **Insurance Plans**: Accepted insurance providers
- **Booking Integration**: Direct booking from provider cards

### 🎯 **Smart Filtering Logic**

```typescript
// Default behavior: Show all providers when no filters applied
// Filtered behavior: Show providers with available slots matching criteria
// Performance: Limits to 20 providers with optimized slot fetching
```

## API Integration

### Database Schema

The feature integrates with the following database tables:

- `providers` - Provider information and capabilities
- `provider_availability` - Weekly recurring schedules
- `provider_availability_exceptions` - Date-specific availability overrides
- `appointments` - Existing bookings for conflict checking

### Real-Time Slot Generation

```typescript
// Automatically generates available slots considering:
// - Provider's weekly schedule
// - Date-specific exceptions
// - Existing appointments
// - Buffer time between appointments
// - Provider timezone preferences

// Slot validation before booking:
// - Real-time availability checking
// - Conflict detection with existing appointments
// - Business hours validation (9 AM - 5 PM)
// - Provider availability schedule validation
```

## Filter Options

### Service Types

- Telehealth consultations
- In-person appointments

### Licensed States

- All US states with provider licensing
- Automatic state matching

### Insurance Plans

- Major insurance providers
- Plan-specific filtering

## Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Grid Layout**: 2-column provider cards on larger screens
- **Collapsible Filters**: Mobile-friendly filter sidebar
- **Loading States**: Smooth loading indicators and skeleton screens

## Dependencies

- **UI Framework**: ShadCN UI components
- **Database**: Supabase client with real-time subscriptions
- **Date Handling**: date-fns for timezone management
- **Icons**: Lucide React icons
- **State Management**: React hooks (no external state library needed)
- **Styling**: Tailwind CSS with custom design system
