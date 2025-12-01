"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { MedicationQuestionnaireData } from "../types";
import {
  MedicalConditionField,
  CurrentMedicationField,
  AllergyField,
} from "@/features/shared/medical-forms";

interface MedicalHistorySectionProps {
  form: UseFormReturn<MedicationQuestionnaireData>;
}

export function MedicalHistorySection({ form }: MedicalHistorySectionProps) {
  // Field arrays for dynamic form fields
  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({
    control: form.control,
    name: "medicalHistory.conditions",
  });

  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication,
  } = useFieldArray({
    control: form.control,
    name: "medicalHistory.medications",
  });

  const {
    fields: allergyFields,
    append: appendAllergy,
    remove: removeAllergy,
  } = useFieldArray({
    control: form.control,
    name: "medicalHistory.allergies",
  });

  const addCondition = () => {
    appendCondition({
      name: "",
      onsetDate: new Date(),
      currentStatus: "Active",
      severity: "Mild",
      notes: "",
    });
  };

  const addMedication = () => {
    appendMedication({
      name: "",
      dosage: "",
      frequency: "Once daily",
      startDate: new Date(),
      currentStatus: "Active",
    });
  };

  const addAllergy = () => {
    appendAllergy({
      allergen: "",
      reaction: "",
      severity: "Mild",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Medical History</h2>
        <p className="text-muted-foreground mb-6">
          Please provide information about your current medical conditions,
          medications, and allergies. This information helps ensure safe
          medication interactions.
        </p>
      </div>

      {/* Current Medical Conditions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Current Medical Conditions</h3>
            <p className="text-sm text-muted-foreground">
              List any ongoing medical conditions you have
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCondition}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        {conditionFields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-muted-foreground">No medical conditions added</p>
            <Button
              type="button"
              variant="ghost"
              onClick={addCondition}
              className="mt-2"
            >
              Add your first condition
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {conditionFields.map((field, index) => (
              <MedicalConditionField
                key={field.id}
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
                index={index}
                onRemove={() => removeCondition(index)}
                fieldPrefix="medicalHistory.conditions"
              />
            ))}
          </div>
        )}
      </div>

      {/* Current Medications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Current Medications</h3>
            <p className="text-sm text-muted-foreground">
              Include prescription and over-the-counter medications, vitamins,
              and supplements
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMedication}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>

        {medicationFields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-muted-foreground">No medications added</p>
            <Button
              type="button"
              variant="ghost"
              onClick={addMedication}
              className="mt-2"
            >
              Add your first medication
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {medicationFields.map((field, index) => (
              <CurrentMedicationField
                key={field.id}
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
                index={index}
                onRemove={() => removeMedication(index)}
                fieldPrefix="medicalHistory.medications"
              />
            ))}
          </div>
        )}
      </div>

      {/* Allergies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Drug Allergies & Reactions</h3>
            <p className="text-sm text-muted-foreground">
              List any known drug allergies or adverse reactions
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAllergy}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Allergy
          </Button>
        </div>

        {allergyFields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-muted-foreground">No allergies added</p>
            <Button
              type="button"
              variant="ghost"
              onClick={addAllergy}
              className="mt-2"
            >
              Add an allergy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {allergyFields.map((field, index) => (
              <AllergyField
                key={field.id}
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
                index={index}
                onRemove={() => removeAllergy(index)}
                fieldPrefix="medicalHistory.allergies"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
