"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TrackerModal } from "@/features/shared";
import { MoodSelector } from "./MoodSelector";
import { TagSelector } from "./TagSelector";
import { useMoodForm } from "../hooks/useMoodForm";

interface MoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MoodEntryModal: React.FC<MoodEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
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
  } = useMoodForm(() => {
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

  const footerActions = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        disabled={!canSave || isSubmitting}
        className="bg-primary hover:bg-primary/90"
      >
        {isSubmitting ? "Saving..." : "Save Mood"}
      </Button>
    </>
  );

  return (
    <TrackerModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Track Your Mood"
      description="Record how you're feeling and what's influencing your mood"
      size="large"
      footerActions={footerActions}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood Selection */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">How are you feeling?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select the mood that best describes how you feel right now
            </p>
          </div>
          <MoodSelector
            selectedMood={selectedMood}
            onSelectMood={setSelectedMood}
          />
        </div>

        {/* Tag Selection */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              What&apos;s influencing your mood?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select any factors that might be affecting how you feel (optional)
            </p>
          </div>
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <Label htmlFor="mood-notes">Additional Notes (Optional)</Label>
          <Textarea
            id="mood-notes"
            placeholder="Add any additional thoughts or context about your mood..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </form>
    </TrackerModal>
  );
};
