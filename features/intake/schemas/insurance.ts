import * as z from "zod";

// Define as array of string literals for better type safety
export const insuranceProviders = [
  "UnitedHealthcare",
  "Blue Cross Blue Shield",
  "Aetna",
  "Cigna",
  "Humana",
  "Kaiser Permanente",
  "Medicare",
  "Medicaid",
  "Anthem",
  "Other",
] as const;

export const relationshipOptions = [
  { label: "Self", value: "self" },
  { label: "Spouse", value: "spouse" },
  { label: "Parent", value: "parent" },
  { label: "Other", value: "other" },
] as const;

export const insuranceSchema = z.object({
  provider: z.string().min(1, "Insurance provider is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  groupNumber: z.string().optional(),
  policyholderName: z.string().min(1, "Policyholder name is required"),
  relationshipToPatient: z.enum(["self", "spouse", "parent", "other"], {
    required_error: "Relationship to patient is required",
  }),
  coverageEffectiveDate: z.date({
    required_error: "Coverage effective date is required",
  }),
  insuranceCardFront: z.object({
    file: z.instanceof(File).optional(),
    preview: z.string().optional(),
  }).optional(),
  insuranceCardBack: z.object({
    file: z.instanceof(File).optional(),
    preview: z.string().optional(),
  }).optional(),
});

export type InsuranceFormValues = z.infer<typeof insuranceSchema>; 