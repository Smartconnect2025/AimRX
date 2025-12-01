"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PatientInformationFormValues,
  patientInformationSchema,
} from "../schemas";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@core/auth";
import { intakePatientService } from "../services/patientService";
import { useEffect, useState } from "react";

// const STORAGE_KEY = "patient-form-data";

export const usePatientForm = () => {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    firstName: "",
    lastName: "",
    dateOfBirth: undefined,
    sexAtBirth: undefined,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    contact: {
      phone: "",
    },
    preferredLanguage: "english" as const,
    height: { feet: undefined, inches: undefined },
    weight: undefined,
  };

  const form = useForm<PatientInformationFormValues>({
    resolver: zodResolver(patientInformationSchema),
    defaultValues,
  });

  // Load data from localStorage or database
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // First try to load from localStorage (draft data)
        // const localData = localStorage.getItem(STORAGE_KEY);
        // if (localData) {
        //   const parsedData = JSON.parse(localData);
        //   // Convert date string back to Date object
        //   if (parsedData.dateOfBirth) {
        //     parsedData.dateOfBirth = new Date(parsedData.dateOfBirth);
        //   }
        //   form.reset(parsedData);
        //   setIsLoading(false);
        //   return;
        // }

        // If no localStorage data, try loading from database
        const result = await intakePatientService.getPatientInformation(
          user.id,
        );
        if (result.success && result.data) {
          form.reset(result.data);
          // Clear localStorage since we have saved data
          // localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
        toast.error("Failed to load existing data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, form]);

  // Save to localStorage on form changes (debounced)
  // useEffect(() => {
  //   if (isLoading) return;

  //   const subscription = form.watch((data) => {
  //     try {
  //       // localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  //     } catch (error) {
  //       console.error("Error saving to localStorage:", error);
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, [form, isLoading]);

  const onSubmit = async (data: PatientInformationFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to save patient information");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await intakePatientService.savePatientInformation(
        user.id,
        data,
      );

      if (result.success) {
        toast.success("Information saved successfully");
        // Clear localStorage after successful save
        // localStorage.removeItem(STORAGE_KEY);
        router.push("/intake/medical-history");
      } else {
        toast.error(result.error || "Failed to save information");
      }
    } catch (error) {
      console.error("Error saving patient information:", error);
      toast.error("Failed to save information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    formatPhoneNumber,
    isLoading,
    isSubmitting,
  };
};
