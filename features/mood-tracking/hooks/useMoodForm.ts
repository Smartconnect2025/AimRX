"use client";

import { useState } from "react";
import { useUser } from "@core/auth";
import { moodService } from "../services/moodService";
import { Mood, MoodFormData } from "../types";
import { toast } from "sonner";

export const useMoodForm = (onSuccess?: () => void) => {
  const { user } = useUser();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSave = selectedMood !== null;

  const resetForm = () => {
    setSelectedMood(null);
    setSelectedTags([]);
    setNotes("");
  };

  const handleSave = async () => {
    if (!user?.id || !selectedMood) {
      toast.error("Please select a mood before saving");
      return false;
    }

    setIsSubmitting(true);

    try {
      const formData: MoodFormData = {
        mood: selectedMood,
        tags: selectedTags,
        notes: notes.trim() || undefined,
      };

      await moodService.createMoodEntry(user.id, formData);

      toast.success("Mood entry saved successfully");
      resetForm();

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save mood entry";
      toast.error(errorMessage);
      console.error("Error saving mood entry:", err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedMood,
    setSelectedMood,
    selectedTags,
    setSelectedTags,
    notes,
    setNotes,
    isSubmitting,
    canSave,
    handleSave,
    resetForm,
  };
};
