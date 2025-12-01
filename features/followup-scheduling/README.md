# Follow-up Scheduling Feature

This feature provides a smart follow-up scheduling system that appears after a telehealth call ends. It allows patients to schedule their next appointment based on provider recommendations.

## Components

- `FollowupModal`: Modal component that displays recommended time slots and handles booking
- `useFollowupScheduling`: Hook that manages the follow-up scheduling state and logic

## Usage

The follow-up scheduling feature is automatically integrated into the video call flow. After a call ends and the patient completes the review, the follow-up modal will appear if the provider has recommended a follow-up appointment.

```tsx
import { useFollowupScheduling } from "@/features/followup-scheduling";

// In your component
const {
  showModal,
  timeSlots,
  showFollowupModal,
  handleClose,
  handleBook,
} = useFollowupScheduling();
```

## Features

- Automatically generates 3 recommended time slots within 2 weeks
- Only shows business hours (9 AM - 5 PM)
- Excludes weekends
- 30-minute appointment slots
- Consistent with app's design system
- Toast notifications for booking confirmation

## Dependencies

- ShadCN UI components
- date-fns for date manipulation
- Sonner for toast notifications 