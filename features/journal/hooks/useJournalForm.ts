"use client";

import { useState } from "react";
import { useUser } from "@core/auth";
import { journalService } from "../services/journalService";
import { JournalFormData } from "../types";
import { toast } from "sonner";

export const useJournalForm = (onSuccess?: () => void) => {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [caffeineServings, setCaffeineServings] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSave = content.trim().length > 0;

  const resetForm = () => {
    setTitle("");
    setContent("");
    setExerciseCompleted(false);
    setCaffeineServings(0);
  };

  const handleSave = async () => {
    if (!user?.id || !canSave) {
      toast.error("Please add some content to your journal entry");
      return false;
    }

    setIsSubmitting(true);

    try {
      const formData: JournalFormData = {
        content: content.trim(),
        did_exercise: exerciseCompleted,
        caffeine_servings: caffeineServings,
      };

      await journalService.createJournalEntry(user.id, formData);

      toast.success("Journal entry saved successfully");
      resetForm();

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save journal entry";
      toast.error(errorMessage);
      console.error("Error saving journal entry:", err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    exerciseCompleted,
    setExerciseCompleted,
    caffeineServings,
    setCaffeineServings,
    isSubmitting,
    canSave,
    handleSave,
    resetForm,
  };
};
