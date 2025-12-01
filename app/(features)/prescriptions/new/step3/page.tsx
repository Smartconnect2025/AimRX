"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PrescriptionFormData {
  medication: string;
  strength: string;
  form: string;
  quantity: string;
  refills: string;
  sig: string;
  dispenseAsWritten: boolean;
  pharmacyNotes: string;
}

export default function PrescriptionStep3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const [prescriptionData, setPrescriptionData] =
    useState<PrescriptionFormData | null>(null);

  useEffect(() => {
    // Load prescription data from sessionStorage
    const data = sessionStorage.getItem("prescriptionData");
    if (data) {
      setPrescriptionData(JSON.parse(data));
    }
  }, []);

  if (!patientId) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-5xl py-8 px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No patient selected
            </h2>
            <Button onClick={() => router.push("/prescriptions/new/step1")}>
              Go Back to Step 1
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const handleBack = () => {
    router.push(`/prescriptions/new/step2?patientId=${patientId}`);
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                New Prescription
              </h1>
              <p className="text-muted-foreground mt-2">
                Step 3 of 3: Review & Submit
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-6">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                ✓
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                Select Patient
              </span>
            </div>
            <div className="w-12 h-0.5 bg-green-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                ✓
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                Prescription Details
              </span>
            </div>
            <div className="w-12 h-0.5 bg-primary"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <span className="ml-2 font-medium">Review & Submit</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">
              Review & Submit (Coming Soon)
            </h2>
            <p className="text-muted-foreground mb-6">
              This step will show a summary of the prescription for review before
              submission to the pharmacy.
            </p>

            {prescriptionData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left max-w-md mx-auto mb-6">
                <h3 className="font-semibold mb-2">Current Prescription Data:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(prescriptionData, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Edit
              </Button>
              <Button disabled>Submit to Pharmacy (Coming Soon)</Button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
