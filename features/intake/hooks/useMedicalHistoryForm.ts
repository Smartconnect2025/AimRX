"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MedicalHistoryFormValues,
  medicalHistorySchema,
} from "../schemas/medical-history";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useUser } from "@core/auth";
import { intakePatientService } from "../services/patientService";
import { medicalHistoryService } from "../services/medicalHistoryService";

// const STORAGE_KEY = "medical-history-form-data";

export const useMedicalHistoryForm = () => {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MedicalHistoryFormValues>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      conditions: [],
      medications: [],
      allergies: [],
    },
  });

  // Handle component mounting
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Load data from localStorage or database after component is mounted
  useEffect(() => {
    if (!isMounted) return;

    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // First try to load saved draft from localStorage
        // const savedData = localStorage.getItem(STORAGE_KEY);
        // if (savedData) {
        //   const parsedData = JSON.parse(savedData);

        //   // Convert date strings back to Date objects
        //   if (parsedData.conditions?.length > 0) {
        //     parsedData.conditions = parsedData.conditions.map(
        //       (condition: {
        //         onsetDate?: string | Date;
        //         [key: string]: unknown;
        //       }) => ({
        //         ...condition,
        //         onsetDate: condition.onsetDate
        //           ? new Date(condition.onsetDate)
        //           : new Date(),
        //       }),
        //     );
        //   }

        //   if (parsedData.medications?.length > 0) {
        //     parsedData.medications = parsedData.medications.map(
        //       (medication: {
        //         startDate?: string | Date;
        //         [key: string]: unknown;
        //       }) => ({
        //         ...medication,
        //         startDate: medication.startDate
        //           ? new Date(medication.startDate)
        //           : new Date(),
        //       }),
        //     );
        //   }

        //   // Reset form with saved data - this will automatically populate the field arrays
        //   form.reset(parsedData);
        //   setIsLoading(false);
        //   return;
        // }

        // If no localStorage draft, try to load from database
        const result = await medicalHistoryService.loadMedicalHistory(user.id);
        if (result.success && result.data) {
          form.reset(result.data);
          // Clear localStorage since we have saved data from database
          // localStorage.removeItem(STORAGE_KEY);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading medical history:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isMounted, user?.id, form]);

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

  // Save form data to localStorage whenever it changes
  // useEffect(() => {
  //   if (!isMounted || isLoading) return;

  //   const subscription = form.watch((data) => {
  //     try {
  //       // Only save if there's actual data
  //       if (
  //         data &&
  //         ((data.conditions && data.conditions.length > 0) ||
  //           (data.medications && data.medications.length > 0) ||
  //           (data.allergies && data.allergies.length > 0))
  //       ) {
  //         // localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  //       }
  //     } catch (error) {
  //       console.error("Error saving medical history to localStorage:", error);
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, [form, isMounted, isLoading]);

  const onSubmit = async (data: MedicalHistoryFormValues) => {
    if (!isMounted || !user?.id) return;

    setIsSubmitting(true);
    try {
      // Save medical history data to both database tables and patient record
      const [dbResult, patientResult] = await Promise.all([
        // Save to dedicated medical history tables
        medicalHistoryService.saveMedicalHistory(user.id, data),
        // Save to patient record for intake tracking
        intakePatientService.updatePatientData(user.id, {
          medical_history: {
            conditions: data.conditions,
            medications: data.medications,
            allergies: data.allergies,
          },
          intake_step: "medical_history_completed",
        }),
      ]);

      if (dbResult.success && patientResult.success) {
        toast.success("Medical history saved successfully");
        // Clear localStorage after successful submission
        // try {
        //   // localStorage.removeItem(STORAGE_KEY);
        // } catch (error) {
        //   console.error("Error clearing medical history localStorage:", error);
        // }
        router.push("/intake/insurance");
      } else {
        const errorMsg =
          dbResult.error ||
          patientResult.error ||
          "Failed to save medical history";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error saving medical history:", error);
      toast.error("Failed to save medical history");
    } finally {
      setIsSubmitting(false);
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
    isSubmitting,
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
