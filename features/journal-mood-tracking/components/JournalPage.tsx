import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DateNavigation } from "./journal/DateNavigation";
import { ActivityTrackers } from "./journal/ActivityTrackers";
import { useJournalForm } from "../hooks/useJournalForm";

interface JournalPageProps {
  onClose?: () => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({ onClose }) => {
  const {
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
  } = useJournalForm();

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
              <span className="sr-only">Close journal</span>
            </Button>
            <h1 className="text-base font-medium absolute left-1/2 transform -translate-x-1/2">
              Journal
            </h1>
            <div className="w-10">{/* Spacer to balance the layout */}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
        <div className="space-y-6">
          {/* Date Navigation */}
          <DateNavigation
            currentDate={currentDate}
            isToday={isToday}
            onPreviousDay={goToPreviousDay}
            onNextDay={goToNextDay}
          />

          {/* Dynamic Headline */}
          <h2 className="text-lg font-semibold text-left mb-6">
            {getHeadline()}
          </h2>

          {/* Journal Text Area */}
          <div className="space-y-2">
            <Label htmlFor="journal-entry" className="font-medium">
              Write about your day
            </Label>
            <Textarea
              id="journal-entry"
              placeholder="My day..."
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              className="min-h-[100px] resize-none border-gray-100 shadow-md"
              disabled={loading}
            />
          </div>

          {/* Activity Trackers */}
          <ActivityTrackers
            didExercise={didExercise}
            setDidExercise={setDidExercise}
            caffeineServings={caffeineServings}
            setCaffeineServings={setCaffeineServings}
          />

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSaveAndClose}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Journal"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
