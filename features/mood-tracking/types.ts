// Mood types
export type Mood = "amazing" | "good" | "neutral" | "anxious" | "angry";

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: Mood;
  tags: string[];
  created_at: string;
}

export interface MoodTag {
  id: string;
  name: string;
  color?: string;
}

export interface MoodFormData {
  mood: Mood;
  tags: string[];
  notes?: string;
}

export interface MoodMetrics {
  averageMood: Mood;
  moodStreak: number;
  totalEntries: number;
  moodDistribution: Record<Mood, number>;
}

// Chart data types
export interface MoodChartData {
  date: string;
  mood: Mood;
  moodValue: number; // Numeric representation for charts
}

export interface MoodTimelineEntry {
  id: string;
  mood: Mood;
  tags: MoodTag[];
  date: string;
  formattedDate: string;
}
