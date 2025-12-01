# Journal Feature

A standalone journaling component that allows users to record their thoughts, experiences, and daily
activities separately from mood tracking.

## Features

- **Rich Text Entries**: Create journal entries with optional titles and detailed content
- **Activity Tracking**: Log daily exercise completion and caffeine consumption
- **Entry History**: Complete log of journal entries with activity indicators
- **Metrics Dashboard**: Track journaling streaks, exercise days, and caffeine patterns
- **Modal Entry**: Consistent modal interface for creating new journal entries

## Components

### Journal

Main dashboard component with:

- Journal metrics cards (total entries, exercise days, average caffeine, current streak)
- Complete journal entries log
- Uses `BaseTrackerLayout` for consistent styling

### JournalEntryModal

Modal for creating new journal entries:

- Uses `TrackerModal` for consistent styling
- Optional title field
- Rich textarea for content
- Exercise completion toggle
- Caffeine servings counter with +/- buttons

### JournalLog

Historical journal entries display:

- Card-based entry layout
- Activity badges (exercise, caffeine)
- Delete functionality
- Date/time formatting
- Content preview with proper text wrapping

## Usage

```tsx
import { Journal } from "@/features/journal";

export default function JournalPage() {
  return <Journal />;
}
```

## Database Schema

The feature expects a `journal_entries` table with:

- `id` (UUID)
- `user_id` (UUID, foreign key)
- `title` (text, optional)
- `content` (text, required)
- `exercise_completed` (boolean)
- `caffeine_servings` (integer)
- `date` (date)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Activity Tracking

### Exercise Tracking

- Simple boolean toggle for daily exercise completion
- Displays exercise badge in journal log
- Counts exercise days in metrics

### Caffeine Tracking

- Counter with increment/decrement buttons
- Range: 0-10 servings per day
- Shows average caffeine consumption
- Displays servings count in journal log

## Architecture

- **Standalone**: Completely separate from mood tracking functionality
- **Modal Pattern**: Uses standardized modal for data entry
- **Consistent Layout**: Uses `BaseTrackerLayout` for uniform UX
- **Type Safety**: Full TypeScript support
- **Real-time Updates**: Automatic refresh after entry changes
- **Error Handling**: Comprehensive error states and user feedback

## Navigation

Accessed via:

- Dashboard navigation card
- Direct route: `/journal`
- Back button navigation to previous page

## Metrics Calculations

- **Total Entries**: All-time count of journal entries
- **Exercise Days**: Days with exercise completed in last 30 days
- **Average Caffeine**: Mean servings per day over all entries
- **Current Streak**: Consecutive days with journal entries
