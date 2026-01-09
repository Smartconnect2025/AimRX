import { z } from "zod";
import { PASSWORD_REGEX } from "@/core/auth/constants";

export const profileFormValidationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
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
        message: "Phone number must be 10 digits",
      },
    ),
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
