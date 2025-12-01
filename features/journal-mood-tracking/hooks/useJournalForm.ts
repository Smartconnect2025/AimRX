import { useState, useEffect } from 'react';
import { formatHeadlineDate, getDateString } from '../utils';
import { useJournalEntries } from './useJournalEntries';

export const useJournalForm = () => {
  const { createOrUpdateEntry, getEntryForDate, loading } = useJournalEntries();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [journalEntry, setJournalEntry] = useState("");
  const [didExercise, setDidExercise] = useState(false);
  const [caffeineServings, setCaffeineServings] = useState(1);
  const [isToday, setIsToday] = useState(true);

  // Load existing entry for the current date
  useEffect(() => {
    const loadEntryForDate = async () => {
      const dateString = getDateString(currentDate);
      try {
        const existingEntry = await getEntryForDate(dateString);
        if (existingEntry) {
          setJournalEntry(existingEntry.content);
          setDidExercise(existingEntry.didExercise);
          setCaffeineServings(existingEntry.caffeineServings);
        } else {
          resetForm();
        }
      } catch (error) {
        console.error('Error loading journal entry:', error);
        resetForm();
      }
    };

    loadEntryForDate();
  }, [currentDate, getEntryForDate]);

  const resetForm = () => {
    setJournalEntry("");
    setDidExercise(false);
    setCaffeineServings(1);
  };

  const getHeadline = () => {
    const formattedDate = formatHeadlineDate(currentDate);
    if (isToday) {
      return `What happened today, ${formattedDate}?`;
    }
    return `What happened on ${formattedDate}?`;
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    setIsToday(false);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    const today = new Date();
    if (newDate > today) return;

    const isNextDayToday = newDate.getDate() === today.getDate() &&
                          newDate.getMonth() === today.getMonth() &&
                          newDate.getFullYear() === today.getFullYear();
    setCurrentDate(newDate);
    setIsToday(isNextDayToday);
  };

  const handleSave = async (onSuccess?: () => void) => {
    try {
      const dateString = getDateString(currentDate);
      await createOrUpdateEntry(dateString, {
        content: journalEntry,
        did_exercise: didExercise,
        caffeine_servings: caffeineServings,
      });

      // Call onSuccess callback after a short delay if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      // Error handling is done in the main hook
    }
  };

  return {
    currentDate,
    journalEntry,
    setJournalEntry,
    didExercise,
    setDidExercise,
    caffeineServings,
    setCaffeineServings,
    isToday,
    getHeadline,
    goToPreviousDay,
    goToNextDay,
    handleSave,
    loading,
  };
};