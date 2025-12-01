"use client";
import { Suspense } from "react";

import { PatientDashboard } from "@/features/patient-dashboard/PatientDashboard";

export default function PatientDashboardPage() {
  return (
    <Suspense>
      <PatientDashboard />
    </Suspense>
  );
}
