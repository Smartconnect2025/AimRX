"use client";

import { useState, useEffect } from "react";
import { useUser } from "@core/auth";
import { moodService } from "../services/moodService";
import { MoodEntry, MoodMetrics } from "../types";
import { toast } from "sonner";

export const useMoodEntries = (limit?: number) => {
  const { user } = useUser();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [metrics, setMetrics] = useState<MoodMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [entriesData, metricsData] = await Promise.all([
        moodService.getMoodEntries(user.id, limit),
        moodService.getMoodMetrics(user.id),
      ]);

      setEntries(entriesData);
      setMetrics(metricsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch mood entries";
      setError(errorMessage);
      console.error("Error fetching mood entries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!user?.id) return false;

    try {
      await moodService.deleteMoodEntry(entryId, user.id);
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));

      // Refetch metrics after deletion
      const updatedMetrics = await moodService.getMoodMetrics(user.id);
      setMetrics(updatedMetrics);

      toast.success("Mood entry deleted successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete mood entry";
      toast.error(errorMessage);
      console.error("Error deleting mood entry:", err);
      return false;
    }
  };

  const refreshEntries = () => {
    fetchEntries();
  };

  useEffect(() => {
    fetchEntries();
  }, [user?.id, limit]);

  return {
    entries,
    metrics,
    isLoading,
    error,
    deleteEntry,
    refreshEntries,
  };
};
