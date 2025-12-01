# Appointment Booking System

This feature provides a comprehensive appointment booking system that integrates provider
availability, patient scheduling, and real-time slot management.

## Features

### 🗓️ **Smart Scheduling**

- **Real-Time Availability**: Integration with provider availability schedules
- **Conflict Prevention**: Server-side validation prevents double-booking
- **Timezone Handling**: Automatic timezone conversion for appointments
- **Configurable Durations**: Provider-specific appointment durations
- **Slot Generation**: Dynamic available time slot generation

### 👥 **User Management**

- **Patient Records**: Automatic patient record creation and management
- **Provider Integration**: Seamless integration with provider schedules
- **Role-Based Access**: Different interfaces for patients and providers
- **Intake Process**: Required intake completion before booking

### ⚡ **Real-Time Updates**

- **Live Appointment Status**: Real-time appointment updates
- **Conflict Detection**: Immediate validation of appointment conflicts
- **Availability Sync**: Real-time sync with provider availability changes

## Architecture

### Core Components

#### **Patient Interface**

- `UpcomingAppointments.tsx` - Main patient appointment dashboard
- `NewAppointmentModal.tsx` - Enhanced booking modal with real-time slots
- `TimeSlotSelector.tsx` - Advanced time slot selection component
- `AppointmentConfirmationModal.tsx` - Streamlined confirmation modal

#### **Integration Layer**

- **Provider Search Integration**: Direct booking from provider search results
- **Provider Dashboard Integration**: Provider appointment management
- **Settings Integration**: Configurable appointment parameters

### Hooks & State Management

#### **Data Management**

- `useAppointments.ts` - Comprehensive appointment CRUD operations with validation

#### **Services**

- `patientService.ts` - Patient record lifecycle management
- `settingsService.ts` - Dynamic appointment configuration management

### Utilities & Validation

#### **Appointment Logic**

- `appointmentValidation.ts` - Multi-layer validation system
  - Future datetime validation
  - Business hours enforcement (9 AM - 5 PM)
  - Provider availability checking
  - Patient conflict detection
  - Buffer time management

#### **Helper Utilities**

- `timezoneUtils.ts` - Timezone conversion and formatting
- `videoCallUtils.ts` - Video call URL generation
- `patientDataUtils.ts` - Patient data structure helpers

## Database Integration

### Core Tables

- `appointments` - Appointment records with provider/patient links
- `providers` - Provider information and capabilities
- `patients` - Patient records linked to auth users
- `provider_availability` - Weekly recurring schedules
- `provider_availability_exceptions` - Date-specific overrides
- `app_settings` - Global appointment configurations
- `provider_settings` - Provider-specific preferences

### Advanced Features

- **Automatic Slot Generation**: Based on provider schedules and existing bookings
- **Conflict Detection**: Real-time checking against existing appointments
- **Buffer Management**: Configurable time buffers between appointments
- **Timezone Storage**: All times stored in UTC with timezone metadata

## Usage

### Patient Appointment Management

```tsx
import { UpcomingAppointments } from "@/features/bookings";

// Main patient dashboard
export default function PatientDashboard() {
  return <UpcomingAppointments />;
}
```

### Provider Booking Integration

```tsx
import { NewAppointmentModal } from "@/features/bookings/components/NewAppointmentModal";

// Provider-initiated booking
function ProviderBooking({ provider, patient }) {
  return (
    <NewAppointmentModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      onCreate={handleCreate}
      provider={provider}
      patientId={patient.id}
      patient={patient}
      isProviderBooking={true}
    />
  );
}
```

### Advanced Booking Flow

#### **1. Provider Search Integration**

```tsx
// Direct booking from provider search results
// Automatically passes provider and pre-selected slot
sessionStorage.setItem("selectedProvider", JSON.stringify(provider));
sessionStorage.setItem("selectedSlot", selectedSlot);
router.push("/appointments"); // Auto-opens booking modal
```

#### **2. Real-Time Slot Selection**

```tsx
// Modal automatically loads available slots based on:
// - Provider's weekly schedule
// - Date-specific exceptions
// - Existing appointment conflicts
// - Timezone preferences
```

#### **3. Validation Pipeline**

```typescript
// Multi-layer validation before booking:
validateAppointmentCreation(providerId, patientId, datetime, duration);
// ✓ Future datetime check
// ✓ Business hours validation (9 AM - 5 PM)
// ✓ Provider availability verification
// ✓ Patient conflict detection
// ✓ Buffer time enforcement
```

## Configuration

### Settings Management

```tsx
import { settingsService } from "@/features/bookings/services/settingsService";

// Global settings (app_settings table)
const defaultDuration = await settingsService.getDefaultPatientDuration("telehealth");
const serviceTypes = await settingsService.getPatientServiceTypes();
const canChange = await settingsService.canPatientChangeDuration();

// Provider-specific settings (provider_settings table)
const providerDuration = await settingsService.getProviderDefaultDuration(providerId, "telehealth");
const allowedDurations = await settingsService.getProviderAllowedDurations(providerId);
const allowChange = await settingsService.doesProviderAllowPatientDurationChange(providerId);
```

### Appointment Types & Durations

```typescript
// Configurable via database settings
interface AppointmentConfiguration {
  defaultTelehealthDuration: 30; // minutes
  defaultInPersonDuration: 45; // minutes
  allowedDurations: [15, 30, 45, 60, 90];
  serviceTypes: ["telehealth", "in_person"];
  patientCanChangeDuration: false;
  businessHours: { start: "09:00"; end: "17:00" };
  bufferMinutes: 0; // No buffer time - allow back-to-back appointments
}
```

## Integration Points

### Provider Dashboard Integration

- Real-time appointment visibility for providers
- Appointment management (cancel, reschedule)
- Patient information display
- Video call launching

### Provider Search Integration

- Available slot display on provider cards
- Direct booking from search results
- Real-time availability status
- Slot pre-selection functionality

### Authentication Integration

- Automatic patient record linking
- Role-based interface rendering
- Intake completion verification
- User timezone detection

## Security & Data Protection

### Row Level Security (RLS)

```sql
-- Patients can only access their own appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- Providers can view their assigned appointments
CREATE POLICY "Providers can view assigned appointments"
  ON appointments FOR SELECT
  USING (provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid()));
```

### Data Validation

- Server-side appointment validation
- Timezone-aware datetime handling
- Conflict prevention at database level
- Input sanitization and type checking

## Performance Optimizations

### Efficient Slot Generation

- Optimized availability queries
- Timezone caching
- Parallel slot computation
- Limited result sets (20 providers, 5 slots per provider)

### Real-Time Updates

- Minimal re-renders with React hooks
- Debounced search and filter updates
- Lazy loading of appointment details
- Efficient provider availability caching

## Error Handling

### Graceful Degradation

- Fallback values for missing settings
- Error boundaries for component failures
- Retry mechanisms for network issues
- User-friendly error messages

### Validation Feedback

- Real-time form validation
- Conflict notification with alternatives
- Clear error messaging
- Loading state management
