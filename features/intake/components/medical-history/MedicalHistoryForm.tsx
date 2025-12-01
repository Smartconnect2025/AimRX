"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useMedicalHistoryForm } from "@/features/intake/hooks/useMedicalHistoryForm";
import { ConditionForm } from "./ConditionForm";
import { MedicationForm } from "./MedicationForm";
import { AllergyForm } from "./AllergyForm";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@core/auth";
import { intakePatientService } from "../../services/patientService";

export function MedicalHistoryForm() {
  const router = useRouter();
  const { user } = useUser();
  const {
    form,
    isLoading,
    isSubmitting,
    onSubmit,
    conditionFields,
    medicationFields,
    allergyFields,
    handleAddCondition,
    handleAddMedication,
    handleAddAllergy,
    removeCondition,
    removeMedication,
    removeAllergy,
  } = useMedicalHistoryForm();

  // Handle any errors during form initialization
  useEffect(() => {
    const handleError = (error: Error) => {
      console.error("Form initialization error:", error);
      toast.error(
        "There was an error loading the form. Please try refreshing the page.",
      );
    };

    try {
      // Any initialization code if needed
    } catch (error) {
      handleError(error as Error);
    }
  }, []);

  const handleGoBack = () => {
    router.push("/intake/patient-information");
  };

  const handleSkip = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to continue");
      return;
    }

    try {
      // Update intake step to mark medical history as completed (even though skipped)
      const result = await intakePatientService.updatePatientData(user.id, {
        intake_step: "medical_history_completed",
      });

      if (result.success) {
        router.push("/intake/insurance");
      } else {
        toast.error("Failed to save progress. Please try again.");
      }
    } catch (error) {
      console.error("Error skipping medical history:", error);
      toast.error("Failed to save progress. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col flex-1">
        <div className="flex-1">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Current and Past Medical Conditions
              </h3>
              <div className="space-y-6">
                {conditionFields.map((field, index) => (
                  <ConditionForm
                    key={field.id}
                    form={form}
                    index={index}
                    onRemove={() => removeCondition(index)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCondition}
                  className="flex items-center gap-2 border border-border"
                >
                  <Plus className="h-4 w-4" />
                  Add Condition
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Medications</h3>
              <div className="space-y-6">
                {medicationFields.map((field, index) => (
                  <MedicationForm
                    key={field.id}
                    form={form}
                    index={index}
                    onRemove={() => removeMedication(index)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddMedication}
                  className="flex items-center gap-2 border border-border"
                >
                  <Plus className="h-4 w-4" />
                  Add Medication
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Allergies</h3>
              <div className="space-y-6">
                {allergyFields.map((field, index) => (
                  <AllergyForm
                    key={field.id}
                    form={form}
                    index={index}
                    onRemove={() => removeAllergy(index)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAllergy}
                  className="flex items-center gap-2 border border-border"
                >
                  <Plus className="h-4 w-4" />
                  Add Allergy
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={handleGoBack}
            disabled={isSubmitting}
          >
            Go back
          </Button>
          <div className="flex gap-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip
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
        </div>
      </form>
    </Form>
  );
}
