# Patient Intake Feature

This feature handles the patient intake process, collecting essential information about new
patients.

## Components

### IntakeHeader

A simplified, distraction-free header specifically designed for the intake process:

- **Minimal branding**: Only displays the logo
- **Optional exit button**: Allows users to leave the intake process
- **Mobile responsive**: Optimized for all screen sizes
- **No navigation elements**: Removes distracting elements like Dashboard, Shop, Notifications
- **Conversion-focused**: Designed to maximize form completion rates

### IntakeLayout

Layout wrapper that provides consistent structure across all intake pages:

- **Simplified header**: Uses IntakeHeader for distraction-free experience
- **Consistent background**: Provides gray background for form contrast
- **Provider integration**: Includes necessary providers (UserProvider, IntakeStatusProvider)

### PatientInformationForm

The main form component that collects:

- Personal Information (name, DOB, sex)
- Contact Information (phone, email)
- Address Information (street, city, state, ZIP)
- Additional details (preferred language, height, weight)

## Usage

### Basic Usage

```tsx
import { PatientInformationForm } from "@/features/intake";

// In your page component
export default function PatientInformationPage() {
  return (
    <div className="container max-w-2xl py-8">
      <PatientInformationForm />
    </div>
  );
}
```

### With Custom Header Configuration

```tsx
import { IntakeLayout, IntakeHeader } from "@/features/intake";

export default function CustomIntakePage() {
  return (
    <IntakeLayout showExitButton={false}>
      <div className="container max-w-2xl py-8">
        <PatientInformationForm />
      </div>
    </IntakeLayout>
  );
}
```

## Form Validation

The form uses Zod for validation with the following rules:

- All fields are required
- Email must be valid
- Phone number must match (XXX) XXX-XXXX format
- ZIP code must be 5 digits
- Date of birth must be between 1900 and current date
- Height and weight must be within reasonable ranges

## State Management

The form uses React Hook Form for state management and validation, with a custom hook
`usePatientForm` that handles:

- Form initialization
- Validation
- Submission
- Phone number formatting
- Navigation after submission

## Database Integration

The intake feature now saves data directly to the Supabase database:

- **Patient Information**: Saved to the `patients` table with core fields (name, DOB, phone, email)
  and additional data in the JSONB `data` field
- **Medical History**: Stored in the `data` field under `medical_history`
- **Insurance Information**: Stored in the `data` field under `insurance`
- **Consent Forms**: Stored in the `data` field with consent timestamps
- **Intake Completion**: Marked with `intake_completed_at` timestamp in the `data` field

## Services

### intakePatientService

Handles all database operations for the intake process:

- `savePatientInformation()`: Creates or updates patient record with basic information
- `updatePatientData()`: Updates the JSONB data field with additional intake information
- `markIntakeCompleted()`: Sets the intake completion timestamp

## Post-Signup Flow

After user signup, they are automatically redirected to `/intake/patient-information` to complete
their patient profile before accessing other features.
