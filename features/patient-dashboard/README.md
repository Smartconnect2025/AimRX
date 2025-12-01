# Patient Dashboard Feature

The Patient Dashboard feature provides a comprehensive interface for patients to manage their
healthcare appointments and find providers.

## Features

- **My Appointments View**: Display all scheduled appointments with provider details, appointment
  types, and status
- **Recent Appointments**: Display past appointments within the last 24 hours with completion status
- **Find Providers Tab**: Integrated provider search functionality using the existing
  provider-search component
- **Appointment Management**: Join, reschedule, and cancel appointments
- **Appointment Organization**: Appointments are grouped by date (Today, Tomorrow, etc.) and sorted
  by time
- **Appointment Types**: Support for video, phone, and chat appointments
- **Status Tracking**: Visual indicators for scheduled, completed, cancelled, and no-show
  appointments

## Components

- **PatientDashboard**: Main dashboard component with tabbed interface
- **PastAppointments**: Component that displays past appointments within the last 24 hours
- **ProviderSearchTab**: Integrates the provider search functionality
- **Types**: TypeScript interfaces for appointments and component props

## Usage

The Patient Dashboard is designed to be displayed on the homepage for users with the "patient" role.

```tsx
import { PatientDashboard } from "@/features/patient-dashboard";

export default function HomePage() {
  const { userRole } = useUser();

  if (userRole === "patient") {
    return <PatientDashboard />;
  }

  // Other user types...
}
```

## Mock Data

Currently uses mock data for appointments. The mock data includes:

- Provider information (name, avatar, specialty)
- Appointment details (date, time, duration, type)
- Status and reason for visit
- Various appointment types (video, phone, chat)

## Integration

- Integrates with the existing `provider-search` feature for finding providers
- Uses the project's UI component library (shadcn/ui)
- Follows the project's styling patterns with Tailwind CSS
- Implements proper TypeScript typing
- Similar structure to the provider dashboard for consistency

## Future Enhancements

- Connect to real appointment data from Supabase
- Add appointment booking functionality
- Implement real-time updates for appointment changes
- Add appointment history and past visits
- Include appointment reminders and notifications
- Add patient health records integration
