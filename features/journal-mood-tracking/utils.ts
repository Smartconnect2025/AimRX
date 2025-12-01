import {
  format,
  startOfMonth,
  endOfMonth,
  isToday,
  subDays,
  isSameDay,
} from "date-fns";
import { MoodEntry, MoodType, JournalEntry } from "./types";
import { MOOD_NUMERIC_VALUES, MOOD_CONFIG } from "./constants";

// Date formatting utilities
export const formatDate = (date: Date): string => {
  if (isToday(date)) return "Today";
  return format(date, "EEE, MMM d");
};

export const formatHeadlineDate = (date: Date): string => {
  return format(date, "MMMM d");
};

export const formatTimeString = (date: Date): string => {
  return format(date, "h:mm a");
};

export const getDateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

// Mood calculation utilities
export const calculateAverageMood = (
  entries: MoodEntry[],
  days: number = 7,
): MoodType => {
  const cutoffDate = subDays(new Date(), days);
  const recentEntries = entries.filter(
    (entry) => new Date(entry.createdAt) >= cutoffDate,
  );

  if (recentEntries.length === 0) return "neutral";

  const sum = recentEntries.reduce(
    (total, entry) => total + MOOD_NUMERIC_VALUES[entry.mood],
    0,
  );
  const average = sum / recentEntries.length;

  // Convert back to mood type
  if (average >= 4.5) return "amazing";
  if (average >= 3.5) return "good";
  if (average >= 2.5) return "neutral";
  if (average >= 1.5) return "anxious";
  return "angry";
};

export const calculateMoodStreak = (entries: MoodEntry[]): number => {
  if (entries.length === 0) return 0;

  // Sort entries by date (most recent first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let streak = 0;
  let currentDate = new Date();

  // Check if there's an entry for today
  const hasEntryToday = sortedEntries.some((entry) =>
    isSameDay(new Date(entry.createdAt), currentDate),
  );

  if (hasEntryToday) {
    streak = 1;
    currentDate = subDays(currentDate, 1);
  }

  // Count consecutive days with entries
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.createdAt);
    if (isSameDay(entryDate, currentDate)) {
      if (!hasEntryToday || streak > 0) {
        streak++;
      }
      currentDate = subDays(currentDate, 1);
    } else if (entryDate < currentDate) {
      break;
    }
  }

  return streak;
};

// Journal calculation utilities
export const calculateJournalingStreak = (entries: JournalEntry[]): number => {
  if (entries.length === 0) return 0;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let streak = 0;
  let currentDate = new Date();

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.createdAt);
    if (isSameDay(entryDate, currentDate)) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else if (entryDate < currentDate) {
      break;
    }
  }

  return streak;
};

export const getMonthlyJournalCount = (entries: JournalEntry[]): number => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= monthStart && entryDate <= monthEnd;
  }).length;
};

export const hasJournaledToday = (entries: JournalEntry[]): boolean => {
  const today = new Date();
  return entries.some((entry) => isSameDay(new Date(entry.createdAt), today));
};

export const getMoodConfig = (mood: MoodType) => {
  return MOOD_CONFIG[mood];
};
