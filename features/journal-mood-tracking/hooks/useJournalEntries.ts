import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@core/auth";
import {
  createJournalEntry,
  updateJournalEntry,
  getUserJournalEntries,
  getJournalEntryForDate,
  deleteJournalEntry,
  type CreateJournalEntryData,
} from "../services/journalService";
import type { JournalEntry } from "../types";

export function useJournalEntries() {
  const { user } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Load all journal entries for the current user
   */
  const loadEntries = useCallback(async () => {
    if (!user?.id) {
      setEntries([]);
      return;
    }

    setLoading(true);
    try {
      const userEntries = await getUserJournalEntries(user.id);
      setEntries(userEntries);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      toast.error("Failed to load journal entries");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Create or update a journal entry for a specific date
   */
  const createOrUpdateEntry = useCallback(
    async (
      date: string,
      data: Omit<CreateJournalEntryData, "user_id" | "date">,
    ) => {
      if (!user?.id) {
        toast.error("You must be logged in to save your journal entry");
        return null;
      }

      setLoading(true);
      try {
        // First check if an entry exists for this date
        const existingEntry = await getJournalEntryForDate(user.id, date);

        let entry: JournalEntry;

        if (existingEntry) {
          // Update existing entry
          entry = await updateJournalEntry(existingEntry.id, {
            content: data.content,
            did_exercise: data.did_exercise,
            caffeine_servings: data.caffeine_servings,
          });
          toast.success("Journal entry updated successfully");

          // Update local state
          setEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? entry : e)),
          );
        } else {
          // Create new entry
          entry = await createJournalEntry({
            user_id: user.id,
            date,
            content: data.content,
            did_exercise: data.did_exercise,
            caffeine_servings: data.caffeine_servings,
          });
          toast.success("Journal entry created successfully");

          // Add to local state
          setEntries((prev) => [entry, ...prev]);
        }

        return entry;
      } catch (error) {
        console.error("Error creating/updating journal entry:", error);
        toast.error("Failed to save journal entry");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  /**
   * Get journal entry for a specific date
   */
  const getEntryForDate = useCallback(
    async (date: string) => {
      if (!user?.id) return null;

      setLoading(true);
      try {
        const entry = await getJournalEntryForDate(user.id, date);
        return entry;
      } catch (error) {
        console.error("Error fetching journal entry for date:", error);
        toast.error("Failed to load journal entry for date");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  /**
   * Delete a journal entry
   */
  const deleteEntry = useCallback(async (entryId: string) => {
    setLoading(true);
    try {
      await deleteJournalEntry(entryId);

      // Update local state
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));

      toast.success("Journal entry deleted");
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      toast.error("Failed to delete journal entry");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh entries list
   */
  const refreshEntries = useCallback(async () => {
    await loadEntries();
  }, [loadEntries]);

  /**
   * Clear entries list
   */
  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  // Auto-load entries when user changes
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return {
    // State
    entries,
    loading,

    // Actions
    createOrUpdateEntry,
    getEntryForDate,
    deleteEntry,
    refreshEntries,
    clearEntries,
    loadEntries,
  };
}
