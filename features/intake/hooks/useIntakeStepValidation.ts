"use client";

import { useState, useEffect } from "react";
import { useUser } from "@core/auth";
import { intakePatientService } from "../services/patientService";

export interface IntakeStepValidation {
  currentStep: number;
  allowedSteps: number[];
  isLoading: boolean;
  error: string | null;
  canAccessStep: (stepNumber: number) => boolean;
  getNextStepUrl: () => string;
}

/**
 * Hook to validate intake step access based on user's current progress
 *
 * @param _requestedStep - The step number the user is trying to access (1-4)
 * @returns Validation state and helper functions
 */
export function useIntakeStepValidation(
  _requestedStep: number,
): IntakeStepValidation {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateStepAccess = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get patient information to check current progress
        const result = await intakePatientService.getPatientInformation(
          user.id,
        );

        if (!result.success) {
          setError(result.error || "Failed to load patient information");
          setCurrentStep(1);
          setIsLoading(false);
          return;
        }

        // If no patient data exists, user is on step 1
        if (!result.data) {
          setCurrentStep(1);
          setIsLoading(false);
          return;
        }

        // We need to get the raw patient data to check intake_step
        // Since getPatientInformation only returns form data, we need to query directly
        const supabase = (await import("@core/supabase/client")).createClient();
        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select("data")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (patientError || !patient) {
          // No patient record found = step 1
          setCurrentStep(1);
        } else {
          // Determine current step based on intake_step in patient data
          const intakeStep = patient.data?.intake_step;
          switch (intakeStep) {
            case "patient_information_completed":
              setCurrentStep(2);
              break;
            case "medical_history_completed":
              setCurrentStep(3);
              break;
            case "insurance_completed":
              setCurrentStep(4);
              break;
            case "completed":
              setCurrentStep(4); // Completed, but allow access to all steps
              break;
            default:
              setCurrentStep(1);
          }
        }
      } catch (err) {
        console.error("Error validating intake step:", err);
        setError("Failed to validate step access");
        setCurrentStep(1);
      } finally {
        setIsLoading(false);
      }
    };

    validateStepAccess();
  }, [user?.id]);

  // Calculate allowed steps based on current progress
  const allowedSteps = Array.from({ length: currentStep }, (_, i) => i + 1);

  // Check if user can access a specific step
  const canAccessStep = (stepNumber: number): boolean => {
    return allowedSteps.includes(stepNumber);
  };

  // Get the next step URL based on current progress
  const getNextStepUrl = (): string => {
    const stepUrls = [
      "/intake/patient-information", // Step 1
      "/intake/medical-history", // Step 2
      "/intake/insurance", // Step 3
      "/intake/consent", // Step 4
    ];

    return stepUrls[currentStep - 1] || "/intake/patient-information";
  };

  return {
    currentStep,
    allowedSteps,
    isLoading,
    error,
    canAccessStep,
    getNextStepUrl,
  };
}
