import { useState } from 'react';
import { MoodType } from '../types';
import { useMoodEntries } from './useMoodEntries';
import { toast } from 'sonner';

export const useMoodTrackerForm = () => {
  const { createEntry, loading } = useMoodEntries();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSave = async (onSuccess?: () => void) => {
    if (!selectedMood) {
      toast.error("Please select a mood", {
        description: "You need to select how you're feeling",
      });
      return;
    }

    try {
      // Create the mood entry
      await createEntry({
        mood: selectedMood,
        tags: selectedTags,
      });

      // Reset form
      setSelectedMood(null);
      setSelectedTags([]);

      // Call onSuccess callback after a short delay if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      // Error handling is done in the main hook
    }
  };

  const resetForm = () => {
    setSelectedMood(null);
    setSelectedTags([]);
  };

  return {
    selectedMood,
    setSelectedMood,
    selectedTags,
    setSelectedTags,
    handleSave,
    resetForm,
    canSave: selectedMood !== null && !loading,
    loading,
  };
};