"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsuranceFormValues, insuranceSchema } from "../schemas/insurance";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { useUser } from "@core/auth";
import { intakePatientService } from "../services/patientService";

export const useInsuranceForm = () => {
  const router = useRouter();
  const { user } = useUser();
  const [insuranceCardFrontPreview, setInsuranceCardFrontPreview] = useState<
    string | null
  >(null);
  const [insuranceCardBackPreview, setInsuranceCardBackPreview] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      provider: "",
      policyNumber: "",
      groupNumber: "",
      policyholderName: "",
      relationshipToPatient: "self",
    },
  });

  const onSubmit = async (data: InsuranceFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to save insurance information");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save insurance data to patient record
      const insuranceData = {
        insurance: {
          provider: data.provider,
          policy_number: data.policyNumber,
          group_number: data.groupNumber,
          policyholder_name: data.policyholderName,
          relationship_to_patient: data.relationshipToPatient,
          coverage_effective_date: data.coverageEffectiveDate?.toISOString(),
          // Note: File uploads would need additional handling for storage
          has_insurance_card_front: !!data.insuranceCardFront?.file,
          has_insurance_card_back: !!data.insuranceCardBack?.file,
        },
        intake_step: "insurance_completed",
      };

      const result = await intakePatientService.updatePatientData(
        user.id,
        insuranceData,
      );

      if (result.success) {
        toast.success("Insurance information saved successfully");
        router.push("/intake/consent");
      } else {
        toast.error(result.error || "Failed to save insurance information");
      }
    } catch (error) {
      console.error("Error saving insurance information:", error);
      toast.error("Failed to save insurance information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "insuranceCardFront" | "insuranceCardBack",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("File must be JPG, PNG, or PDF");
      return;
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === "insuranceCardFront") {
          setInsuranceCardFrontPreview(reader.result as string);
          form.setValue("insuranceCardFront", {
            file,
            preview: reader.result as string,
          });
        } else {
          setInsuranceCardBackPreview(reader.result as string);
          form.setValue("insuranceCardBack", {
            file,
            preview: reader.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Handle PDF files (no preview)
      if (field === "insuranceCardFront") {
        form.setValue("insuranceCardFront", { file });
      } else {
        form.setValue("insuranceCardBack", { file });
      }
    }
  };

  const handleGoBack = () => {
    router.push("/intake/patient-information");
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    handleFileUpload,
    handleGoBack,
    insuranceCardFrontPreview,
    insuranceCardBackPreview,
    setInsuranceCardFrontPreview,
    setInsuranceCardBackPreview,
    isSubmitting,
  };
};
