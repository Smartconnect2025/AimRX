import * as z from "zod";

// Main schema for all consent sections
export const consentFormSchema = z.object({
  telehealth: z.union([
    z.boolean().refine((val) => val, {
      message: "You must agree to the Telehealth Consent Form",
    }),
    z.record(z.boolean()),
  ]),
  hipaa: z.union([
    z.boolean().refine((val) => val, {
      message: "You must agree to the HIPAA Authorization",
    }),
    z.record(z.boolean()),
  ]),
});

// Schema for signature-based consent
export const signatureConsentSchema = z.object({
  consentText: z.string(),
  signatureData: z.string().min(1, "Electronic signature is required"),
  consentType: z.string(),
});

// Schema for consent data stored in patient.data column
export const patientConsentDataSchema = z.object({
  signature_consent: z
    .object({
      consent_type: z.string(),
      consent_text: z.string(),
      signature_data: z.string(),
      user_agent: z.string().optional(),
      consent_given_at: z.string().datetime(),
    })
    .optional(),
  // Existing checkbox consents
  telehealth_consent: z.boolean().optional(),
  hipaa_consent: z.boolean().optional(),
  consent_completed_at: z.string().datetime().optional(),
});

export type ConsentFormValues = z.infer<typeof consentFormSchema>;
export type SignatureConsentValues = z.infer<typeof signatureConsentSchema>;
export type PatientConsentData = z.infer<typeof patientConsentDataSchema>;
