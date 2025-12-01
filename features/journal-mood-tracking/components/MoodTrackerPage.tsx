import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoodSelector } from "./mood/MoodSelector";
import { TagSelector } from "./mood/TagSelector";
import { useMoodTrackerForm } from "../hooks/useMoodTrackerForm";

interface MoodTrackerPageProps {
  onClose?: () => void;
}

export const MoodTrackerPage: React.FC<MoodTrackerPageProps> = ({
  onClose,
}) => {
  const {
    selectedMood,
    setSelectedMood,
    selectedTags,
    setSelectedTags,
    handleSave,
    canSave,
  } = useMoodTrackerForm();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default behavior - could use Next.js router
      console.log("Navigate back to dashboard");
    }
  };

  const handleSaveAndClose = () => {
    handleSave(handleClose);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="mr-4"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close mood tracker</span>
            </Button>
            <h1 className="text-base font-medium absolute left-1/2 transform -translate-x-1/2">
              Track Mood
            </h1>
            <div className="w-10">{/* Spacer */}</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
        <div className="space-y-8">
          {/* Mood selector */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-center">
              How are you feeling?
            </h2>
            <MoodSelector
              selectedMood={selectedMood}
              onSelectMood={setSelectedMood}
            />
          </div>

          {/* Tag selector */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-center">
              What&apos;s influencing your mood?
            </h2>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>

          {/* Save button */}
          <div className="pt-4">
            <Button
              onClick={handleSaveAndClose}
              className="w-full bg-[#4BCBC7] hover:bg-[#3BABA7] text-white"
              disabled={!canSave}
            >
              Save Mood
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
