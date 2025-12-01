# Mood Tracking Feature

A standalone mood tracking component that allows users to monitor their daily emotional well-being
separately from journaling.

## Features

- **Mood Selection**: Choose from 5 mood states (Amazing, Good, Neutral, Anxious, Angry)
- **Tag System**: Add contextual tags to mood entries (Work, Family, Sleep, etc.)
- **Visual Charts**: Line chart showing mood trends over time
- **Mood Metrics**: Average mood, streak tracking, and total entries
- **Entry History**: Complete log of mood entries with notes and tags
- **Modal Entry**: Consistent modal interface for adding new mood entries

## Components

### MoodTracker

Main dashboard component with:

- Mood metrics cards
- Interactive mood trend chart
- Recent entries log
- Uses `BaseTrackerLayout` for consistent styling

### MoodEntryModal

Modal for adding new mood entries:

- Uses `TrackerModal` for consistent styling
- Mood selection with visual icons
- Tag selection for context
- Optional notes field

### MoodChart

Interactive line chart:

- Uses Recharts for visualization
- Shows 14-day mood trends
- Custom tooltips with mood details
- Responsive design

### MoodLog

Historical mood entries:

- Card-based entry display
- Tag badges and notes
- Delete functionality
- Date/time formatting

### MoodSelector

Visual mood selection:

- 5 mood options with icons
- Hover and selected states
- Accessible button implementation

### TagSelector

Contextual tag selection:

- Predefined mood influence tags
- Multi-select functionality
- Badge-based UI

## Usage

```tsx
import { MoodTracker } from "@/features/mood-tracking";

export default function MoodTrackerPage() {
  return <MoodTracker />;
}
```

## Database Schema

The feature expects a `mood_entries` table with:

- `id` (UUID)
- `user_id` (UUID, foreign key)
- `mood` (enum: amazing, good, neutral, anxious, angry)
- `tags` (JSON array)
- `notes` (text, optional)
- `date` (date)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Architecture

- **Standalone**: Completely separate from journal functionality
- **Modal Pattern**: Uses standardized modal for data entry
- **Consistent Layout**: Uses `BaseTrackerLayout` for uniform UX
- **Type Safety**: Full TypeScript support
- **Real-time Updates**: Automatic refresh after entry changes
- **Error Handling**: Comprehensive error states and user feedback

## Navigation

Accessed via:

- Dashboard navigation card
- Direct route: `/mood-tracker`
- Back button navigation to previous page
