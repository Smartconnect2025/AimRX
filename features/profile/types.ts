import { z } from "zod";
import { PASSWORD_REGEX } from "@/core/auth/constants";

export interface PatientAddress {
  street: string;
  line2?: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface PatientDataFields {
  address?: PatientAddress;
  display_name?: string;
  sex_at_birth?: string;
  [key: string]: unknown;
}

export interface PatientData {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
  data: PatientDataFields;
  emr_data: PatientDataFields | null;
  provider_id: string | null;
  status: string | null;
  emr_created_at: string | null;
  emr_updated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone?: string;
  email: string;
  data?: PatientDataFields;
  user_id?: string;
  is_active?: boolean;
}

export interface PersonalInformation {
  firstName: string;
  lastName: string;
  displayName?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other" | "";
  avatarUrl?: string;
}

export interface ContactInformation {
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  streetAddressLine1: string;
  streetAddressLine2?: string;
  city: string;
  state: string;
  zipPostalCode: string;
}

export interface SecurityData {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile extends PersonalInformation, ContactInformation {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Zod schemas for validation
export const personalInformationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  displayName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional().or(z.literal("")),
  avatarUrl: z.string().optional(),
});

export const contactInformationSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        // Remove all non-digits and check if it's exactly 10 digits
        const digits = val.replace(/\D/g, "");
        return digits.length === 10;
      },
      {
        message: "Invalid phone number",
      },
    ),
  streetAddressLine1: z.string().min(1, "Street address is required"),
  streetAddressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipPostalCode: z.string().min(1, "ZIP/Postal code is required"),
});

export const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must contain uppercase, lowercase, number, and special character",
    ),
});

export type PersonalInformationFormData = z.infer<
  typeof personalInformationSchema
>;
export type ContactInformationFormData = z.infer<
  typeof contactInformationSchema
>;
export type SecurityFormData = z.infer<typeof securitySchema>;
