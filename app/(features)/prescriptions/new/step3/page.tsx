"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEmrStore } from "@/features/basic-emr/store/emr-store";

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
  const [submitting, setSubmitting] = useState(false);

  const patients = useEmrStore((state) => state.patients);
  const selectedPatient = patients.find((p) => p.id === patientId);

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

  if (!prescriptionData) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-5xl py-8 px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No prescription data found
            </h2>
            <Button onClick={() => router.push("/prescriptions/new/step2?patientId=" + patientId)}>
              Go Back to Step 2
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const handleBack = () => {
    router.push(`/prescriptions/new/step2?patientId=${patientId}`);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Get encounter/appointment context from session storage
      const encounterId = sessionStorage.getItem("encounterId");
      const appointmentId = sessionStorage.getItem("appointmentId");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock queue ID
      const queueId = `RX${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create the new prescription object
      const newPrescription = {
        id: `submitted_${Date.now()}`,
        queueId,
        dateTime: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Unknown Patient",
        providerName: "Dr. Current Provider", // In real app, get from user context
        medication: prescriptionData.medication,
        strength: prescriptionData.strength,
        form: prescriptionData.form,
        quantity: parseInt(prescriptionData.quantity),
        refills: parseInt(prescriptionData.refills),
        sig: prescriptionData.sig,
        status: "Submitted",
        dispenseAsWritten: prescriptionData.dispenseAsWritten,
        pharmacyNotes: prescriptionData.pharmacyNotes || undefined,
        encounterId: encounterId || null,
        appointmentId: appointmentId || null,
      };

      // Save to localStorage so it appears in both provider and admin lists
      const existingPrescriptions = JSON.parse(localStorage.getItem("submittedPrescriptions") || "[]");
      existingPrescriptions.unshift(newPrescription); // Add to beginning of array
      localStorage.setItem("submittedPrescriptions", JSON.stringify(existingPrescriptions));

      console.log("Prescription submitted and saved:", newPrescription);

      // Clear session storage
      sessionStorage.removeItem("prescriptionData");
      sessionStorage.removeItem("selectedPatientId");
      sessionStorage.removeItem("prescriptionDraft");
      sessionStorage.removeItem("encounterId");
      sessionStorage.removeItem("appointmentId");

      setSubmitting(false);

      // Show success toast
      toast.success(`Prescription submitted! QueueID: ${queueId}`, {
        duration: 5000,
        description: encounterId
          ? "Linked to encounter visit"
          : "Standalone prescription",
      });

      // Redirect to prescriptions list after brief delay
      setTimeout(() => {
        router.push("/prescriptions");
      }, 1500);
    } catch (error) {
      setSubmitting(false);
      toast.error("Failed to submit prescription. Please try again.");
      console.error("Submission error:", error);
    }
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
            <Button variant="outline" onClick={() => router.push("/")} disabled={submitting}>
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

        {/* Review Content */}
        <div className="bg-white border border-border rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Review Prescription</h2>
          </div>

          {/* Patient Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Patient Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {selectedPatient
                      ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                      : "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {selectedPatient?.dateOfBirth
                      ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPatient?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedPatient?.phone || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medication Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Medication Information
            </h3>
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Medication</p>
                  <p className="font-semibold text-lg">
                    {prescriptionData.medication}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strength</p>
                  <p className="font-medium">{prescriptionData.strength}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Form</p>
                  <p className="font-medium">{prescriptionData.form}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{prescriptionData.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refills</p>
                  <p className="font-medium">{prescriptionData.refills}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Dispense as Written
                  </p>
                  <p className="font-medium">
                    {prescriptionData.dispenseAsWritten ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Directions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Directions for Patient (SIG)
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">{prescriptionData.sig}</p>
            </div>
          </div>

          {/* Pharmacy Notes */}
          {prescriptionData.pharmacyNotes && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Notes to Pharmacy
              </h3>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-gray-900">{prescriptionData.pharmacyNotes}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={handleBack} disabled={submitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
            <Button
              onClick={handleSubmit}
              size="lg"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Submit Prescription
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
