"use client";

import { useState, useEffect } from "react";
import { useUser } from "@core/auth";
import { journalService } from "../services/journalService";
import { JournalEntry, JournalMetrics } from "../types";
import { toast } from "sonner";

export const useJournalEntries = (limit?: number) => {
  const { user } = useUser();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [metrics, setMetrics] = useState<JournalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [entriesData, metricsData] = await Promise.all([
        journalService.getJournalEntries(user.id, limit),
        journalService.getJournalMetrics(user.id),
      ]);

      setEntries(entriesData);
      setMetrics(metricsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch journal entries";
      setError(errorMessage);
      console.error("Error fetching journal entries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!user?.id) return false;

    try {
      await journalService.deleteJournalEntry(entryId, user.id);
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));

      // Refetch metrics after deletion
      const updatedMetrics = await journalService.getJournalMetrics(user.id);
      setMetrics(updatedMetrics);

      toast.success("Journal entry deleted successfully");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete journal entry";
      toast.error(errorMessage);
      console.error("Error deleting journal entry:", err);
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
