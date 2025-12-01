import { format, isToday, subDays, isSameDay } from "date-fns";
import { Smile, ThumbsUp, Meh, Frown, Angry as AngryIcon } from "lucide-react";
import { MoodEntry, Mood } from "./types";

// Mood configuration
export const MOOD_CONFIG = {
  amazing: {
    icon: Smile,
    color: "text-green-500",
    bgColor: "bg-green-100",
    label: "Amazing",
    value: 5,
  },
  good: {
    icon: ThumbsUp,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    label: "Good",
    value: 4,
  },
  neutral: {
    icon: Meh,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    label: "Neutral",
    value: 3,
  },
  anxious: {
    icon: Frown,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    label: "Anxious",
    value: 2,
  },
  angry: {
    icon: AngryIcon,
    color: "text-red-500",
    bgColor: "bg-red-100",
    label: "Angry",
    value: 1,
  },
} as const;

export const MOOD_NUMERIC_VALUES: Record<Mood, number> = {
  amazing: 5,
  good: 4,
  neutral: 3,
  anxious: 2,
  angry: 1,
};

// Date formatting utilities
export const formatDate = (date: Date): string => {
  if (isToday(date)) return "Today";
  return format(date, "EEE, MMM d");
};

export const formatHeadlineDate = (date: Date): string => {
  return format(date, "MMMM d");
};

export const getDateString = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

// Mood calculation utilities
export const calculateAverageMood = (
  entries: MoodEntry[],
  days: number = 7,
): Mood => {
  const cutoffDate = subDays(new Date(), days);
  const recentEntries = entries.filter(
    (entry) => new Date(entry.created_at) >= cutoffDate,
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
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  let streak = 0;
  let currentDate = new Date();

  // Check if there's an entry for today
  const hasEntryToday = sortedEntries.some((entry) =>
    isSameDay(new Date(entry.created_at), currentDate),
  );

  if (hasEntryToday) {
    streak = 1;
    currentDate = subDays(currentDate, 1);
  }

  // Count consecutive days with entries
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.created_at);
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

export const getMoodConfig = (mood: Mood) => {
  return MOOD_CONFIG[mood];
};

// Chart data transformation
export const transformMoodDataForChart = (entries: MoodEntry[]) => {
  return entries.map((entry) => ({
    date: entry.created_at,
    mood: entry.mood,
    moodValue: MOOD_NUMERIC_VALUES[entry.mood],
  }));
};
