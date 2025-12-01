import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useUser } from '@core/auth';
import { createMoodEntry, getUserMoodEntries, getMoodEntriesForDate, deleteMoodEntry, type CreateMoodEntryData } from '../services/moodService';
import type { MoodEntry } from '../types';

export function useMoodEntries() {
  const { user } = useUser();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Load all mood entries for the current user
   */
  const loadEntries = useCallback(async () => {
    if (!user?.id) {
      setEntries([]);
      return;
    }

    setLoading(true);
    try {
      const userEntries = await getUserMoodEntries(user.id);
      setEntries(userEntries);
    } catch (error) {
      console.error('Error loading mood entries:', error);
      toast.error('Failed to load mood entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Create a new mood entry
   */
  const createEntry = useCallback(async (data: Omit<CreateMoodEntryData, 'user_id'>) => {
    if (!user?.id) {
      toast.error("You must be logged in to save your mood");
      return null;
    }

    setLoading(true);
    try {
      const entry = await createMoodEntry({
        user_id: user.id,
        mood: data.mood,
        tags: data.tags,
      });

      // Add to local state
      setEntries(prev => [entry, ...prev]);

      toast.success('Mood entry created successfully');
      return entry;
    } catch (error) {
      console.error('Error creating mood entry:', error);
      toast.error('Failed to create mood entry');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Get mood entries for a specific date
   */
  const getEntriesForDate = useCallback(async (date: string) => {
    if (!user?.id) return [];

    setLoading(true);
    try {
      const dateEntries = await getMoodEntriesForDate(user.id, date);
      return dateEntries;
    } catch (error) {
      console.error('Error fetching mood entries for date:', error);
      toast.error('Failed to load mood entries for date');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Delete a mood entry
   */
  const deleteEntry = useCallback(async (entryId: string) => {
    setLoading(true);
    try {
      await deleteMoodEntry(entryId);

      // Update local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));

      toast.success('Mood entry deleted');
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      toast.error('Failed to delete mood entry');
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
    createEntry,
    getEntriesForDate,
    deleteEntry,
    refreshEntries,
    clearEntries,
    loadEntries,
  };
}