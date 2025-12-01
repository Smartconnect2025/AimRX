"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  baseMedicalHistorySchema,
  type BaseMedicalHistory,
} from "@/features/shared/medical-forms";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { markQuestionnaireCompleted } from "../utils";
import { useCart } from "@/features/cart/hooks/useCart";

export const useMedicationQuestionnaireForm = () => {
  const router = useRouter();
  const { items } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BaseMedicalHistory>({
    resolver: zodResolver(baseMedicalHistorySchema),
    defaultValues: {
      conditions: [],
      medications: [],
      allergies: [],
    },
  });

  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({
    control: form.control,
    name: "conditions",
  });

  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication,
  } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const {
    fields: allergyFields,
    append: appendAllergy,
    remove: removeAllergy,
  } = useFieldArray({
    control: form.control,
    name: "allergies",
  });

  const onSubmit = async (data: BaseMedicalHistory) => {
    setIsLoading(true);

    try {
      // Save questionnaire data (in production, this would be an API call)
      console.log("Medical questionnaire completed:", data);

      // Mark questionnaire as completed for all weight loss medications in cart
      const weightLossMedications = items
        .filter((item) => item.category_name === "WEIGHT LOSS")
        .map((item) => item.slug);

      markQuestionnaireCompleted("user123", weightLossMedications); // TODO: Get real user ID

      // Also set a simple flag for checkout page compatibility
      localStorage.setItem("questionnaireCompleted", "true");

      toast.success(
        "Medical questionnaire completed successfully! Redirecting to checkout...",
      );

      // Small delay before redirect to allow toast to show
      setTimeout(() => {
        router.push("/checkout");
      }, 1500);
    } catch (error) {
      console.error("Error saving questionnaire:", error);
      toast.error("Failed to save questionnaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCondition = () => {
    appendCondition({
      name: "",
      onsetDate: new Date(),
      currentStatus: "Active",
      severity: "Mild",
      notes: "",
    });
  };

  const handleAddMedication = () => {
    appendMedication({
      name: "",
      dosage: "",
      frequency: "Once daily",
      startDate: new Date(),
      currentStatus: "Active",
    });
  };

  const handleAddAllergy = () => {
    appendAllergy({
      allergen: "",
      reaction: "",
      severity: "Mild",
    });
  };

  return {
    form,
    isLoading,
    onSubmit: form.handleSubmit(onSubmit),
    conditionFields,
    medicationFields,
    allergyFields,
    handleAddCondition,
    handleAddMedication,
    handleAddAllergy,
    removeCondition,
    removeMedication,
    removeAllergy,
  };
};
