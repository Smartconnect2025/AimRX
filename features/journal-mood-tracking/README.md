# Journal and Mood Tracking Feature

## Overview

This feature provides a comprehensive journal and mood tracking system that helps users maintain daily journaling habits and track their emotional well-being over time.

## Core Functionality

### Journal Features
- Daily journal entries with date navigation
- Exercise tracking (yes/no toggle)
- Caffeine consumption tracking with serving counts
- Journaling streak and completion tracking
- Persistent storage of journal entries

### Mood Tracking
- 5 mood states: Amazing, Good, Neutral, Anxious, Angry
- Visual mood selection with icons and color coding
- Tag system for mood influences (Work, Family, Sleep, Exercise, Yoga)
- Timeline view of mood entries grouped by date
- Mood analytics and streak tracking

### Dashboard
- Personalized overview with key metrics
- Average mood calculation over the last 7 days
- Mood streak counter
- Monthly journaling statistics
- Quick access to journal and mood tracking

## Components

### Main Pages
- `JournalMoodDashboard` - Main dashboard with overview and metrics
- `JournalPage` - Daily journal entry interface
- `MoodTrackerPage` - Mood tracking and tagging interface

### Dashboard Components
- `MetricsCard` - Reusable metric display cards
- `JournalCard` - Journal entry status and quick access
- `MoodTimeline` - Historical mood entry timeline

### Journal Components
- `JournalForm` - Main journal entry form
- `DateNavigation` - Date switching controls
- `ActivityTrackers` - Exercise and caffeine tracking toggles

### Mood Components
- `MoodSelector` - Visual mood selection interface
- `TagSelector` - Tag selection for mood influences
- `MoodEmoji` - Mood visualization component
- `MoodEntry` - Individual mood entry display

## State Management

### Unified Hook Architecture
The feature uses a simplified state management approach with unified hooks:

- **`useJournalEntries`** - Single hook managing all journal entry operations
- **`useMoodEntries`** - Single hook managing all mood entry operations
- **`useJournalForm`** - Form-specific state for journal entries
- **`useMoodTrackerForm`** - Form-specific state for mood tracking
- **`useDashboardData`** - Combines data from both hooks for dashboard metrics

### Data Flow
```
Components → useJournalEntries/useMoodEntries → Supabase Services
```

## Validation

- Zod schemas for journal and mood entry validation
- React Hook Form integration for form handling
- Type-safe data structures throughout

## Usage

```typescript
// Import the main dashboard component
import { JournalMoodDashboard } from '@/features/journal-mood-tracking';

// Use in a page component
export default function DashboardPage() {
  return <JournalMoodDashboard />;
}
```

## Future Enhancements

- Advanced mood analytics and insights
- Customizable mood categories and tags
- Export functionality for journal entries
- Reminder and notification system