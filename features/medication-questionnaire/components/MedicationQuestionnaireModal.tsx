"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { X, AlertTriangle, CheckCircle } from "lucide-react";
import {
  MedicationQuestionnaireProps,
  MedicationQuestionnaireData,
  medicationQuestionnaireSchema,
} from "../types";
import { getRequiredQuestionSections } from "../utils";
import { MedicalHistorySection } from "./MedicalHistorySection";
import { PregnancySection } from "./PregnancySection";
import { WeightLossSection } from "./WeightLossSection";
import { GeneralHealthSection } from "./GeneralHealthSection";
import { SignatureConsentForm } from "@/features/intake/components/consent/SignatureConsentForm";
import { medicationConsentText } from "../constants/medication-consent-text";

export function MedicationQuestionnaireModal({
  open,
  medications,
  onComplete,
  onCancel,
}: MedicationQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [hasSignature, setHasSignature] = useState(false);

  // Determine which sections are needed based on medications
  const requiredSections = getRequiredQuestionSections(medications);

  // Build step configuration
  const steps = [
    { id: "medical-history", title: "Medical History", required: true },
    { id: "general-health", title: "General Health", required: true },
    ...(requiredSections.requiresPregnancyQuestions
      ? [
          {
            id: "pregnancy",
            title: "Pregnancy & Breastfeeding",
            required: true,
          },
        ]
      : []),
    ...(requiredSections.requiresWeightLossQuestions
      ? [{ id: "weight-loss", title: "Weight Management", required: true }]
      : []),
    { id: "consent", title: "Consent & Acknowledgment", required: true },
  ];

  const form = useForm<MedicationQuestionnaireData>({
    resolver: zodResolver(medicationQuestionnaireSchema),
    defaultValues: {
      medicalHistory: {
        conditions: [],
        medications: [],
        allergies: [],
      },
      generalHealthQuestions: {
        currentlyTreatedByDoctor: "no",
        smokingStatus: "never",
        alcoholConsumption: "none",
      },
      consent: {
        acknowledgeRisks: false,
        consentToTreatment: false,
      },
    },
  });

  const handleNext = async () => {
    // Validate current step before proceeding
    const currentStepId = steps[currentStep].id;
    let fieldsToValidate: string[] = [];

    switch (currentStepId) {
      case "medical-history":
        fieldsToValidate = ["medicalHistory"];
        break;
      case "general-health":
        fieldsToValidate = ["generalHealthQuestions"];
        break;
      case "pregnancy":
        fieldsToValidate = ["pregnancyStatus"];
        break;
      case "weight-loss":
        fieldsToValidate = ["weightLossQuestions"];
        break;
      case "consent":
        // For signature-based consent, we validate the signature separately
        if (!hasSignature || !signatureData) {
          toast.error("Please provide your electronic signature to continue");
          return;
        }
        break;
    }

    // Only validate form fields if we have fields to validate (not for signature consent)
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(
        fieldsToValidate as (keyof MedicationQuestionnaireData)[],
      );
      if (!isValid) {
        toast.error("Please complete all required fields before continuing");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      // Include signature data with the form submission
      const completeData = {
        ...formData,
        signatureConsent: {
          signatureData,
          consentType: "medication_therapy",
          consentText: medicationConsentText,
          consentGivenAt: new Date().toISOString(),
        },
      };
      await onComplete(completeData);
      toast.success("Medical questionnaire completed successfully");
    } catch (error) {
      console.error("Failed to submit questionnaire:", error);
      toast.error("Failed to submit questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    const currentStepId = steps[currentStep].id;

    switch (currentStepId) {
      case "medical-history":
        return <MedicalHistorySection form={form} />;
      case "general-health":
        return <GeneralHealthSection form={form} />;
      case "pregnancy":
        return <PregnancySection form={form} />;
      case "weight-loss":
        return <WeightLossSection form={form} />;
      case "consent":
        return (
          <SignatureConsentForm
            userId="questionnaire-user" // This could be enhanced to use actual user ID
            title="Medication Therapy Consent"
            consentText={medicationConsentText}
            onSignatureChange={setSignatureData}
            onSignatureStatusChange={setHasSignature}
            showNavigation={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Medical Questionnaire</DialogTitle>
              <DialogDescription>
                Complete this questionnaire to ensure safe medication dispensing
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {steps[currentStep].title}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Medication list */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-blue-600" />
            Medications requiring questionnaire:
          </h3>
          <ul className="text-sm space-y-1">
            {medications.map((medication) => (
              <li key={medication.id} className="flex items-center">
                <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                {medication.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Form content */}
        <Form {...form}>
          <form className="space-y-6">{renderCurrentStep()}</form>
        </Form>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          <div className="flex items-center space-x-3">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              {currentStep === steps.length - 1 ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
