"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import TelehealthConsentDialog from "@/features/intake/components/consent/TelehealthConsentDialog";
import HipaaConsentDialog from "@/features/intake/components/consent/HipaaConsentDialog";
import { SignatureConsentForm } from "@/features/intake/components/consent/SignatureConsentForm";
import { ProgressBar } from "@/features/intake/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { useUser } from "@core/auth";
import { intakePatientService } from "@/features/intake/services/patientService";
import { crmEventTriggers } from "@core/services/crm";
import { envConfig } from "@/core/config";
import { IntakeStepGuard } from "@/features/intake/components/IntakeStepGuard";

export default function ConsentFormsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [telehealthConsent, setTelehealthConsent] = useState(false);
  const [hipaaConsent, setHipaaConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [hasSignature, setHasSignature] = useState(false);

  const handleCheckboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telehealthConsent || !hipaaConsent) {
      toast.error("Please agree to both consent forms to continue");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to complete intake");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save consent information and mark intake as completed
      const consentData = {
        checkbox_consent: {
          telehealth_consent: telehealthConsent,
          hipaa_consent: hipaaConsent,
          consent_completed_at: new Date().toISOString(),
        },
      };

      const updateResult = await intakePatientService.updatePatientData(
        user.id,
        consentData,
      );

      if (updateResult.success) {
        // Mark intake as completed
        const completionResult = await intakePatientService.markIntakeCompleted(
          user.id,
        );

        if (completionResult.success) {
          // Send Onboarding Completed event to CRM (non-blocking)
          if (user.email) {
            crmEventTriggers.onboardingCompleted(user.id, user.email);
          }

          toast.success("Your intake forms have been submitted successfully");
          router.replace("/");
        } else {
          toast.error("Failed to complete intake process");
        }
      } else {
        toast.error("Failed to save consent information");
      }
    } catch (error) {
      console.error("Error completing intake:", error);
      toast.error("Failed to complete intake process");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSignature || !signatureData) {
      toast.error("Please provide your electronic signature to continue");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to complete intake");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save signature consent information similar to checkbox consent
      const consentData = {
        signature_consent: {
          signature_data: signatureData,
          consent_completed_at: new Date().toISOString(),
        },
      };

      const updateResult = await intakePatientService.updatePatientData(
        user.id,
        consentData,
      );

      if (updateResult.success) {
        // Mark intake as completed
        const completionResult = await intakePatientService.markIntakeCompleted(
          user.id,
        );

        if (completionResult.success) {
          toast.success("Your intake forms have been submitted successfully");
          router.replace("/");
        } else {
          toast.error("Failed to complete intake process");
        }
      } else {
        toast.error("Failed to save consent information");
      }
    } catch (error) {
      console.error("Error completing intake:", error);
      toast.error("Failed to complete intake process");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Signature consent mode (controlled by environment variable)
  if (envConfig.USE_SIGNATURE_CONSENT && user?.id) {
    return (
      <IntakeStepGuard stepNumber={4}>
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl mb-6">
            <ProgressBar currentStep={4} totalSteps={4} />
          </div>
          <form
            onSubmit={handleSignatureSubmit}
            className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-sm mt-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <SignatureConsentForm
                userId={user.id}
                onSignatureChange={setSignatureData}
                onSignatureStatusChange={setHasSignature}
                showNavigation={false}
              />
            </div>
            <div className="flex justify-between items-center mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/intake/insurance")}
                disabled={isSubmitting}
              >
                Go back
              </Button>
              <Button type="submit" variant="default" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </form>
        </div>
      </IntakeStepGuard>
    );
  }

  // Original checkbox consent mode (default)
  return (
    <IntakeStepGuard stepNumber={4}>
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <ProgressBar currentStep={4} totalSteps={4} />
        </div>
        <form
          onSubmit={handleCheckboxSubmit}
          className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-sm mt-6 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <TelehealthConsentDialog
              checked={telehealthConsent}
              onCheckedChange={setTelehealthConsent}
            />
            <HipaaConsentDialog
              checked={hipaaConsent}
              onCheckedChange={setHipaaConsent}
            />
          </div>
          <div className="flex justify-between items-center mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/intake/insurance")}
              disabled={isSubmitting}
            >
              Go back
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </div>
    </IntakeStepGuard>
  );
}
