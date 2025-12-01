"use client";

import { useRouter } from "next/navigation";
import { JournalMoodDashboard } from "@features/journal-mood-tracking";

export default function JournalMoodTrackingPage() {
  const router = useRouter();
  
  const handleJournalClick = () => {
    router.push("/journal-mood-tracking/journal");
  };

  const handleMoodTrackerClick = () => {
    router.push("/journal-mood-tracking/mood");
  };

  return (
    <JournalMoodDashboard 
      onJournalClick={handleJournalClick}
      onMoodTrackerClick={handleMoodTrackerClick}
    />
  );
} 