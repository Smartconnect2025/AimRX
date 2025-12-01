import { createClient } from "@core/supabase";
import type { JournalEntry } from "../types";

// Database types matching the schema
export interface DatabaseJournalEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  did_exercise: boolean;
  caffeine_servings: number;
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntryData {
  user_id: string;
  date: string;
  content: string;
  did_exercise: boolean;
  caffeine_servings: number;
}

export interface UpdateJournalEntryData {
  content: string;
  did_exercise: boolean;
  caffeine_servings: number;
}

/**
 * Create a new journal entry
 */
export async function createJournalEntry(
  data: CreateJournalEntryData,
): Promise<JournalEntry> {
  try {
    const supabase = createClient();

    const { data: journalEntry, error } = await supabase
      .from("journal_entries")
      .insert({
        user_id: data.user_id,
        date: data.date,
        content: data.content,
        did_exercise: data.did_exercise,
        caffeine_servings: data.caffeine_servings,
      })
      .select()
      .single();

    if (error) throw error;

    return transformDatabaseJournalEntryToJournalEntry(journalEntry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(
  entryId: string,
  data: UpdateJournalEntryData,
): Promise<JournalEntry> {
  try {
    const supabase = createClient();

    const { data: journalEntry, error } = await supabase
      .from("journal_entries")
      .update({
        content: data.content,
        did_exercise: data.did_exercise,
        caffeine_servings: data.caffeine_servings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)
      .select()
      .single();

    if (error) throw error;

    return transformDatabaseJournalEntryToJournalEntry(journalEntry);
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
}

/**
 * Get all journal entries for a user
 */
export async function getUserJournalEntries(
  userId: string,
): Promise<JournalEntry[]> {
  try {
    const supabase = createClient();

    const { data: journalEntries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;

    return journalEntries.map(transformDatabaseJournalEntryToJournalEntry);
  } catch (error) {
    console.error("Error fetching user journal entries:", error);
    throw error;
  }
}

/**
 * Get journal entry for a specific date
 */
export async function getJournalEntryForDate(
  userId: string,
  date: string,
): Promise<JournalEntry | null> {
  try {
    const supabase = createClient();

    const { data: journalEntry, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Entry not found
      }
      throw error;
    }

    return transformDatabaseJournalEntryToJournalEntry(journalEntry);
  } catch (error) {
    console.error("Error fetching journal entry for date:", error);
    throw error;
  }
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(entryId: string): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    throw error;
  }
}

/**
 * Transform database journal entry to application journal entry format
 */
function transformDatabaseJournalEntryToJournalEntry(
  dbEntry: DatabaseJournalEntry,
): JournalEntry {
  return {
    id: dbEntry.id,
    date: dbEntry.date,
    content: dbEntry.content,
    didExercise: dbEntry.did_exercise,
    did_exercise: dbEntry.did_exercise,
    caffeineServings: dbEntry.caffeine_servings,
    caffeine_servings: dbEntry.caffeine_servings,
    createdAt: new Date(dbEntry.created_at),
    created_at: new Date(dbEntry.created_at),
    updatedAt: new Date(dbEntry.updated_at),
    updated_at: new Date(dbEntry.updated_at),
    userId: dbEntry.user_id,
    user_id: dbEntry.user_id,
  };
}
