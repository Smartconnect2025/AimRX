import { z } from "zod";
import { baseMedicalHistorySchema } from "@/features/shared/medical-forms";

// Medication-specific question schemas
export const pregnancyStatusSchema = z.object({
  isPregnant: z.enum(["yes", "no", "unsure"], {
    required_error: "Please select your pregnancy status",
  }),
  isBreastfeeding: z.enum(["yes", "no"], {
    required_error: "Please select if you are breastfeeding",
  }),
  planningPregnancy: z.enum(["yes", "no", "unsure"], {
    required_error: "Please select if you are planning pregnancy",
  }),
});

export const weightLossQuestionsSchema = z.object({
  currentWeight: z.string().min(1, "Current weight is required"),
  goalWeight: z.string().min(1, "Goal weight is required"),
  previousWeightLossAttempts: z.enum(["yes", "no"], {
    required_error: "Please select if you've tried weight loss before",
  }),
  previousWeightLossDetails: z.string().optional(),
  currentDiet: z.string().optional(),
  exerciseFrequency: z.enum(
    ["none", "1-2 times per week", "3-4 times per week", "5+ times per week"],
    {
      required_error: "Please select your exercise frequency",
    },
  ),
});

export const generalHealthQuestionsSchema = z.object({
  lastPhysicalExam: z.date({
    required_error: "Date of last physical exam is required",
  }),
  currentlyTreatedByDoctor: z.enum(["yes", "no"], {
    required_error: "Please select if currently under medical care",
  }),
  doctorName: z.string().optional(),
  smokingStatus: z.enum(["never", "current", "former"], {
    required_error: "Please select your smoking status",
  }),
  alcoholConsumption: z.enum(
    [
      "none",
      "occasionally",
      "1-2 drinks per week",
      "3-7 drinks per week",
      "more than 7 per week",
    ],
    {
      required_error: "Please select your alcohol consumption",
    },
  ),
});

// Medication-specific consent schema
export const medicationConsentSchema = z.object({
  acknowledgeRisks: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the risks to continue",
  }),
  consentToTreatment: z.boolean().refine((val) => val === true, {
    message: "You must consent to treatment to continue",
  }),
});

// Complete questionnaire schema
export const medicationQuestionnaireSchema = z.object({
  // Reuse medical history from shared components
  medicalHistory: baseMedicalHistorySchema,

  // Medication-specific questions
  pregnancyStatus: pregnancyStatusSchema.optional(),
  weightLossQuestions: weightLossQuestionsSchema.optional(),
  generalHealthQuestions: generalHealthQuestionsSchema,

  // Use the medication-specific consent schema
  consent: medicationConsentSchema,
});

// Export types
export type PregnancyStatus = z.infer<typeof pregnancyStatusSchema>;
export type WeightLossQuestions = z.infer<typeof weightLossQuestionsSchema>;
export type GeneralHealthQuestions = z.infer<
  typeof generalHealthQuestionsSchema
>;
export type MedicationQuestionnaireData = z.infer<
  typeof medicationQuestionnaireSchema
>;

// Helper type for medication requirements
export interface MedicationRequirement {
  productId: string;
  requiresPregnancyQuestions: boolean;
  requiresWeightLossQuestions: boolean;
  specificWarnings?: string[];
}

// Props for questionnaire components
export interface MedicationQuestionnaireProps {
  open: boolean;
  medications: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  onComplete: (data: MedicationQuestionnaireData) => void;
  onCancel: () => void;
}
