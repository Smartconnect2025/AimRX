"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { JournalPage } from "@features/journal-mood-tracking";

export default function JournalPageRoute() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/journal-mood-tracking");
  };

  return (
    <Suspense>
      <JournalPage onClose={handleClose} />
    </Suspense>
  );
}
