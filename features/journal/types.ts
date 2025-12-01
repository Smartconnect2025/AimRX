export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  did_exercise: boolean;
  caffeine_servings: number;
  created_at: string;
  updated_at: string;
}

export interface JournalFormData {
  content: string;
  did_exercise: boolean;
  caffeine_servings: number;
}

export interface JournalMetrics {
  totalEntries: number;
  exerciseDays: number;
  averageCaffeine: number;
  currentStreak: number;
}

export interface JournalDayStatus {
  date: string;
  hasEntry: boolean;
  did_exercise?: boolean;
  caffeine_servings?: number;
}
