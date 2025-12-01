import { createClient } from "@core/supabase/client";
import type { MoodEntry, MoodType } from "../types";

// Database types matching the schema
export interface DatabaseMoodEntry {
  id: string;
  user_id: string;
  mood: MoodType;
  tags: string[];
  created_at: string;
}

export interface CreateMoodEntryData {
  user_id: string;
  mood: MoodType;
  tags: string[];
}

/**
 * Create a new mood entry
 */
export async function createMoodEntry(
  data: CreateMoodEntryData,
): Promise<MoodEntry> {
  try {
    const supabase = createClient();

    const { data: moodEntry, error } = await supabase
      .from("mood_entries")
      .insert({
        user_id: data.user_id,
        mood: data.mood,
        tags: data.tags,
      })
      .select()
      .single();

    if (error) throw error;

    return transformDatabaseMoodEntryToMoodEntry(moodEntry);
  } catch (error) {
    console.error("Error creating mood entry:", error);
    throw error;
  }
}

/**
 * Get all mood entries for a user
 */
export async function getUserMoodEntries(userId: string): Promise<MoodEntry[]> {
  try {
    const supabase = createClient();

    const { data: moodEntries, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return moodEntries.map(transformDatabaseMoodEntryToMoodEntry);
  } catch (error) {
    console.error("Error fetching user mood entries:", error);
    throw error;
  }
}

/**
 * Get mood entries for a specific date
 */
export async function getMoodEntriesForDate(
  userId: string,
  date: string,
): Promise<MoodEntry[]> {
  try {
    const supabase = createClient();

    const { data: moodEntries, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("created_at::date", date)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return moodEntries.map(transformDatabaseMoodEntryToMoodEntry);
  } catch (error) {
    console.error("Error fetching mood entries for date:", error);
    throw error;
  }
}

/**
 * Delete a mood entry
 */
export async function deleteMoodEntry(entryId: string): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("mood_entries")
      .delete()
      .eq("id", entryId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting mood entry:", error);
    throw error;
  }
}

/**
 * Transform database mood entry to application mood entry format
 */
function transformDatabaseMoodEntryToMoodEntry(
  dbEntry: DatabaseMoodEntry,
): MoodEntry {
  const createdAt = new Date(dbEntry.created_at);

  return {
    id: dbEntry.id,
    mood: dbEntry.mood,
    timestamp: createdAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    date: createdAt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    tags: dbEntry.tags || [],
    createdAt: createdAt,
    created_at: createdAt,
    userId: dbEntry.user_id,
    user_id: dbEntry.user_id,
  };
}
