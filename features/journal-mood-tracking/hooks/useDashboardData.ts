import { useMemo } from 'react';
import { useMoodEntries } from './useMoodEntries';
import { useJournalEntries } from './useJournalEntries';
import { calculateAverageMood, calculateMoodStreak, hasJournaledToday } from '../utils';
import { DashboardMetrics } from '../types';

export const useDashboardData = () => {
  const { entries: moodEntries, loading: moodLoading } = useMoodEntries();
  const { entries: journalEntries, loading: journalLoading } = useJournalEntries();

  const data = useMemo(() => {
    const hasJournaledTodayValue = hasJournaledToday(journalEntries);

    const metrics: DashboardMetrics = {
      averageMood: calculateAverageMood(moodEntries),
      moodStreak: calculateMoodStreak(moodEntries),
      daysJournaled: journalEntries.length,
      hasJournaledToday: hasJournaledTodayValue,
    };

    const journalStatus = {
      hasJournaledToday: hasJournaledTodayValue,
    };

    // Get recent mood entries (last 7 days)
    const recentMoodEntries = moodEntries.slice(0, 10);

    return {
      metrics,
      journalStatus,
      recentMoodEntries,
      isLoading: moodLoading || journalLoading,
    };
  }, [moodEntries, journalEntries, moodLoading, journalLoading]);

  return data;
};