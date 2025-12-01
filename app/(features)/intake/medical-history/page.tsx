"use client";

import { MedicalHistoryForm } from "@/features/intake/components/medical-history/MedicalHistoryForm";
import { ProgressBar } from "@/features/intake/components/ProgressBar";
import { IntakeStepGuard } from "@/features/intake/components/IntakeStepGuard";

export default function MedicalHistoryPage() {
  return (
    <IntakeStepGuard stepNumber={2}>
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <ProgressBar currentStep={2} totalSteps={4} />
        </div>
        <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-sm mt-6">
          <MedicalHistoryForm />
        </div>
      </div>
    </IntakeStepGuard>
  );
}
