import { z } from "zod";
import { GENDER_OPTIONS } from "@/core/constants/provider-enums";
import { PASSWORD_REGEX } from "@/core/auth/constants";

export const profileFormValidationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(
    GENDER_OPTIONS.map((option) => option.value) as [string, ...string[]],
    { required_error: "Gender is required" },
  ),
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
  avatarUrl: z.string().optional(),
  // Payment & Billing Information
  physicalAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  taxId: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentSchedule: z.string().optional(),
  paymentDetails: z.object({
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    accountType: z.string().optional(),
    swiftCode: z.string().optional(),
  }).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormValidationSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      PASSWORD_REGEX,
      "Password must contain uppercase, lowercase, number, and special character",
    ),
});

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
