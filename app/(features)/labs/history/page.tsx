import { Suspense } from "react";
import LabsHistoryView from "@/features/labs/LabsHistoryView";

export default function LabsHistoryPage() {
  return (
    <Suspense>
      <LabsHistoryView />
    </Suspense>
  );
}
