// Main components
export { JournalMoodDashboard } from "./components/JournalMoodDashboard";
export { JournalPage } from "./components/JournalPage";
export { MoodTrackerPage } from "./components/MoodTrackerPage";

// Hooks
export { useJournalEntries } from "./hooks/useJournalEntries";
export { useMoodEntries } from "./hooks/useMoodEntries";
export { useJournalForm } from "./hooks/useJournalForm";
export { useMoodTrackerForm } from "./hooks/useMoodTrackerForm";
export { useDashboardData } from "./hooks/useDashboardData";

// Types
export type {
  JournalEntry,
  MoodEntry,
  MoodType,
  DashboardMetrics,
  MoodAnalytics,
} from "./types";

// Services
export {
  createJournalEntry,
  updateJournalEntry,
  getUserJournalEntries,
  getJournalEntryForDate,
  deleteJournalEntry,
  type CreateJournalEntryData,
  type UpdateJournalEntryData,
  type DatabaseJournalEntry
} from "./services/journalService";

export {
  createMoodEntry,
  getUserMoodEntries,
  getMoodEntriesForDate,
  deleteMoodEntry,
  type CreateMoodEntryData,
  type DatabaseMoodEntry
} from "./services/moodService";

// Utils
export {
  formatHeadlineDate,
  getDateString,
  calculateAverageMood,
  calculateMoodStreak,
  hasJournaledToday,
  getMoodConfig,
} from "./utils";

// Constants
export {
  MOOD_TYPES,
  MOOD_CONFIG,
  MOOD_TAGS,
  MOOD_NUMERIC_VALUES,
  STORAGE_KEYS
} from "./constants";