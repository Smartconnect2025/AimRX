"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIntakeStepValidation } from "../hooks/useIntakeStepValidation";

interface IntakeStepGuardProps {
  stepNumber: number;
  children: React.ReactNode;
}

/**
 * Component that guards intake steps to prevent URL-based navigation to later steps
 *
 * @param stepNumber - The step number this guard is protecting (1-4)
 * @param children - The page content to render if access is allowed
 */
export function IntakeStepGuard({
  stepNumber,
  children,
}: IntakeStepGuardProps) {
  const router = useRouter();
  const { currentStep, isLoading, error, canAccessStep, getNextStepUrl } =
    useIntakeStepValidation(stepNumber);

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Handle errors by allowing access (graceful degradation)
    if (error) {
      console.warn("Intake step validation error:", error);
      return;
    }

    // Check if user can access this step
    if (!canAccessStep(stepNumber)) {
      // Get step names for user-friendly message
      const stepNames = {
        1: "Patient Information",
        2: "Medical History",
        3: "Insurance",
        4: "Consent Forms",
      };
      const currentStepName =
        stepNames[currentStep as keyof typeof stepNames] ||
        `Step ${currentStep}`;
      const targetStepName =
        stepNames[stepNumber as keyof typeof stepNames] || `Step ${stepNumber}`;

      // Show user-friendly message with specific step name
      toast.error(
        `Please complete ${currentStepName} before accessing ${targetStepName}`,
      );

      // Redirect to the appropriate step
      const redirectUrl = getNextStepUrl();
      router.replace(redirectUrl);
    }
  }, [
    isLoading,
    error,
    canAccessStep,
    stepNumber,
    currentStep,
    getNextStepUrl,
    router,
  ]);

  // Show loading state while validating
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show error state (but still allow access for graceful degradation)
  if (error) {
    console.warn("Intake step validation failed, allowing access:", error);
  }

  // Render children if access is allowed
  return <>{children}</>;
}
