import { z } from "zod";
import { PASSWORD_REGEX } from "@/core/auth/constants";

export const profileFormValidationSchema = z.object({
  firstName: z.string().optional(), // Read-only field
  lastName: z.string().optional(), // Read-only field
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phoneNumber: z.string().optional(), // Read-only field
  avatarUrl: z.string().optional(),
  medicalLicenses: z.array(z.object({
    licenseNumber: z.string().min(1, "License number is required"),
    state: z.string().min(1, "State is required"),
  })).optional(),
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
