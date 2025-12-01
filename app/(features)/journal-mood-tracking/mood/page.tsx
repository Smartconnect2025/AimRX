"use client";

import { useRouter } from "next/navigation";
import { MoodTrackerPage } from "@features/journal-mood-tracking";

export default function MoodTrackerPageRoute() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return <MoodTrackerPage onClose={handleClose} />;
} 