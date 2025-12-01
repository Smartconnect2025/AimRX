import { Laugh, Smile, Meh, Frown, Angry } from "lucide-react";
import { MoodType } from "./types";

export const MOOD_TYPES: MoodType[] = [
  "amazing",
  "good",
  "neutral",
  "anxious",
  "angry",
];

export const MOOD_CONFIG = {
  amazing: {
    label: "Amazing",
    icon: Laugh,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  good: {
    label: "Good",
    icon: Smile,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  neutral: {
    label: "Neutral",
    icon: Meh,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  anxious: {
    label: "Anxious",
    icon: Frown,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  angry: {
    label: "Angry",
    icon: Angry,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
} as const;

export const MOOD_TAGS = [
  "Work",
  "Family",
  "Sleep",
  "Exercise",
  "Yoga",
  "Social",
  "Health",
  "Weather",
  "Stress",
  "Travel",
] as const;

export const MOOD_NUMERIC_VALUES: Record<MoodType, number> = {
  amazing: 5,
  good: 4,
  neutral: 3,
  anxious: 2,
  angry: 1,
};

export const STORAGE_KEYS = {
  MOOD_ENTRIES: "journal-mood-tracking:mood-entries",
  JOURNAL_ENTRIES: "journal-mood-tracking:journal-entries",
  HAS_JOURNALED_TODAY: "journal-mood-tracking:has-journaled-today",
} as const;
