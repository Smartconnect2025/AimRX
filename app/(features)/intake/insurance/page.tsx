"use client";

import { ProgressBar } from "@/features/intake/components/ProgressBar";
import { InsuranceForm } from "@/features/intake/components/insurance/InsuranceForm";
import { IntakeStepGuard } from "@/features/intake/components/IntakeStepGuard";

export default function InsurancePage() {
  return (
    <IntakeStepGuard stepNumber={3}>
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <ProgressBar currentStep={3} totalSteps={4} />
        </div>
        <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-sm mt-6">
          <InsuranceForm />
        </div>
      </div>
    </IntakeStepGuard>
  );
}
