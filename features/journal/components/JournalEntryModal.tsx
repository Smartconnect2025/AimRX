"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TrackerModal } from "@/features/shared";
import { useJournalForm } from "../hooks/useJournalForm";
import { Minus, Plus } from "lucide-react";

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
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
  } = useJournalForm(() => {
    onSuccess?.();
    onClose();
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canSave && !isSubmitting) {
      await handleSave();
    }
  };

  const adjustCaffeine = (delta: number) => {
    const newValue = Math.max(0, Math.min(10, caffeineServings + delta));
    setCaffeineServings(newValue);
  };

  const footerActions = (
    <>
      <Button
        variant="outline"
        className="border-border"
        onClick={handleClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        disabled={!canSave || isSubmitting}
        className="bg-primary hover:bg-primary/90"
      >
        {isSubmitting ? "Saving..." : "Save Entry"}
      </Button>
    </>
  );

  return (
    <TrackerModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Journal Entry"
      description="Record your thoughts, experiences, and daily activities"
      size="large"
      footerActions={footerActions}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="journal-title">Title (Optional)</Label>
          <Input
            id="journal-title"
            placeholder="Give your entry a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="journal-content">Journal Entry *</Label>
          <Textarea
            id="journal-content"
            placeholder="What's on your mind today? Share your thoughts, experiences, or reflections..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="resize-none text-base"
            required
          />
          <p className="text-sm text-muted-foreground">
            {content.length} characters
          </p>
        </div>

        {/* Activity Trackers */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Daily Activities</h3>

          {/* Exercise Toggle */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-1">
              <Label
                htmlFor="exercise-toggle"
                className="text-base font-medium"
              >
                Exercise Completed
              </Label>
              <p className="text-sm text-muted-foreground">
                Did you exercise today?
              </p>
            </div>
            <Switch
              id="exercise-toggle"
              checked={exerciseCompleted}
              onCheckedChange={setExerciseCompleted}
            />
          </div>

          {/* Caffeine Counter */}
          <div className="p-4 border border-border rounded-lg">
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">
                  Caffeine Servings
                </Label>
                <p className="text-sm text-muted-foreground">
                  How many cups of coffee, tea, or caffeinated drinks did you
                  have?
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustCaffeine(-1)}
                    disabled={caffeineServings === 0}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="text-xl font-semibold min-w-[2ch] text-center">
                    {caffeineServings}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustCaffeine(1)}
                    disabled={caffeineServings === 10}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <span className="text-sm text-muted-foreground">
                  {caffeineServings === 1 ? "serving" : "servings"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </TrackerModal>
  );
};
