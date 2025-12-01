// Import database schema types
import type {
  JournalEntry as DBJournalEntry,
  MoodEntry as DBMoodEntry,
} from "@/core/database/schema";

export type MoodType = "amazing" | "good" | "neutral" | "anxious" | "angry";

// Frontend MoodEntry interface extending database schema with proper date handling and camelCase compatibility
export interface MoodEntry
  extends Omit<DBMoodEntry, "created_at" | "user_id" | "tags"> {
  createdAt: Date; // camelCase for frontend compatibility
  created_at: Date; // Keep snake_case for database compatibility
  userId: string; // camelCase for frontend compatibility
  user_id: string; // Keep snake_case for database compatibility
  timestamp: string; // Additional frontend field for display
  date: string; // Additional frontend field for display
  tags: string[]; // Ensure tags is always an array (database allows null)
  mood: MoodType; // Typed mood instead of generic string
}

// Frontend JournalEntry interface extending database schema with proper date handling and camelCase compatibility
export interface JournalEntry
  extends Omit<
    DBJournalEntry,
    | "created_at"
    | "updated_at"
    | "user_id"
    | "date"
    | "did_exercise"
    | "caffeine_servings"
  > {
  createdAt: Date; // camelCase for frontend compatibility
  created_at: Date; // Keep snake_case for database compatibility
  updatedAt: Date; // camelCase for frontend compatibility
  updated_at: Date; // Keep snake_case for database compatibility
  userId: string; // camelCase for frontend compatibility
  user_id: string; // Keep snake_case for database compatibility
  date: string; // Convert Date to string for frontend display
  didExercise: boolean; // camelCase for frontend compatibility
  did_exercise: boolean; // Keep snake_case for database compatibility
  caffeineServings: number; // camelCase for frontend compatibility
  caffeine_servings: number; // Keep snake_case for database compatibility
}

export interface DashboardMetrics {
  averageMood: MoodType;
  moodStreak: number;
  daysJournaled: number;
  hasJournaledToday: boolean;
}

export interface MoodAnalytics {
  moodDistribution: Record<MoodType, number>;
  tagFrequency: Record<string, number>;
  weeklyAverage: MoodType;
  currentStreak: number;
}

export interface JournalAnalytics {
  totalEntries: number;
  currentStreak: number;
  monthlyCount: number;
  exerciseFrequency: number;
  caffeineFrequency: number;
}

// Database operation types (re-export for CRUD operations)
export type {
  InsertJournalEntry as CreateJournalEntryData,
  InsertMoodEntry as CreateMoodEntryData,
  UpdateJournalEntry as UpdateJournalEntryData,
  UpdateMoodEntry as UpdateMoodEntryData,
} from "@/core/database/schema";
