# Goal Tracking Feature

A comprehensive goal tracking system that allows users to set, monitor, and achieve their health-related goals.

## Features

- Create and manage health goals
- Track progress with visual indicators
- Categorize goals (Exercise, Nutrition, Sleep, Mental Health)
- Set milestones and track achievements
- View goal history and statistics

## Components

### GoalTracker
The main component that serves as the container for all goal tracking features. It includes:
- Goal creation form
- Goal list view
- Progress tracking
- Statistics dashboard

### GoalCard
Displays individual goal information including:
- Goal title and description
- Progress bar
- Target and current values
- Start and end dates
- Status management

### GoalForm
A form component for creating and editing goals with:
- Title and description fields
- Category selection
- Target value and unit selection
- Date range picker
- Form validation

### GoalList
Displays a list of goals with:
- Active and completed goals tabs
- Grid layout for goal cards
- Empty state handling

## Usage

```tsx
import { GoalTracker } from '@/features/goal-tracking';

export default function GoalsPage() {
  return <GoalTracker />;
}
```

## State Management

The feature uses Zustand for state management with the following store:

```tsx
interface GoalStore {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addGoal: (formData: GoalFormData) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  updateProgress: (id: string, current: number) => void;
  setError: (error: string | null) => void;
}
```

## Types

The feature includes the following main types:

```tsx
interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  target: number;
  current: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  status: GoalStatus;
  progress: number;
  milestones: Milestone[];
}

type GoalCategory = 'exercise' | 'nutrition' | 'sleep' | 'mental' | 'other';
type GoalStatus = 'active' | 'completed' | 'abandoned';
```

## Dependencies

- React Hook Form + Zod for form handling
- ShadCN UI components
- date-fns for date manipulation
- Lucide React for icons
- Zustand for state management 