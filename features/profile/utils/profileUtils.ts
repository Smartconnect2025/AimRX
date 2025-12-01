import type { PatientData, PatientInput, UserProfile } from "../types";
import { PROFILE_CONFIG } from "../constants/constants";
import { formatPhoneNumber } from "@/features/checkout/utils";
import { PASSWORD_REGEX } from "@/core/auth/constants";
import { createClient } from "@/core/supabase/client";
import { getStateName } from "../constants";

// Re-export the existing phone formatter for consistency
export { formatPhoneNumber };

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
}

/**
 * Get stored profile from localStorage
 */
export function getStoredProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem(PROFILE_CONFIG.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading profile from localStorage:", error);
  }

  return null;
}

/**
 * Save profile to localStorage
 */
export function saveProfileToStorage(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_CONFIG.STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving profile to localStorage:", error);
  }
}

/**
 * Generate mock profile data
 */
export function generateMockProfile(): UserProfile {
  return {
    id: PROFILE_CONFIG.DEMO_USER_ID,
    email: "jd@topfrightapps.com",
    emailVerified: true,
    firstName: "John",
    lastName: "Doe",
    displayName: "johnd",
    dateOfBirth: "1989-12-31",
    gender: "Male",
    phoneNumber: "(XXX) XXX-XXXX",
    phoneVerified: false,
    streetAddressLine1: "123 Main St",
    streetAddressLine2: "Apt 4B",
    city: "San Francisco",
    state: "CA",
    zipPostalCode: "94105",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get profile data (from storage or generate mock)
 */
export function getProfileData(): UserProfile {
  const stored = getStoredProfile();
  if (stored) {
    return stored;
  }

  return generateMockProfile();
}

/**
 * Update profile data
 */
export function updateProfileData(updates: Partial<UserProfile>): UserProfile {
  const currentProfile = getProfileData();
  const updatedProfile: UserProfile = {
    ...currentProfile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveProfileToStorage(updatedProfile);

  // Trigger custom event to notify other components
  window.dispatchEvent(new CustomEvent("profile-updated"));

  return updatedProfile;
}

/**
 * Validate password using existing regex
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message: string;
} {
  if (!PASSWORD_REGEX.test(password)) {
    return {
      isValid: false,
      message:
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
    };
  }

  return { isValid: true, message: "Password is strong" };
}

/**
 * Verify current password against Supabase auth
 */
export async function verifyCurrentPassword(
  currentPassword: string,
): Promise<boolean> {
  try {
    const supabase = createClient();

    // Sign in with current password to verify it's correct
    const { error } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || "",
      password: currentPassword,
    });

    return !error;
  } catch (error) {
    console.error("Error verifying current password:", error);
    return false;
  }
}

/**
 * Helper function to convert gender to proper case
 */
export function getGenderDisplayValue(
  gender: string,
): "Male" | "Female" | "Other" | "" {
  if (!gender) return "";

  const normalizedGender = gender.toLowerCase();

  if (normalizedGender === "male") return "Male";
  if (normalizedGender === "female") return "Female";
  if (normalizedGender === "other") return "Other";

  return "";
}

/**
 * Helper function to convert gender to lowercase for API storage
 */
export function getGenderStorageValue(gender: string | undefined): string {
  if (!gender) return "";
  return gender.toLowerCase();
}

export function convertToUserProfile(patient: PatientData): UserProfile {
  const genderValue = getGenderDisplayValue(patient.data?.sex_at_birth || "");

  return {
    id: patient.id,
    firstName: patient.first_name,
    lastName: patient.last_name,
    displayName: patient.data?.display_name || "",
    dateOfBirth: patient.date_of_birth,
    gender: genderValue,
    avatarUrl: patient.avatar_url || undefined,
    email: patient.email,
    emailVerified: true, // Assuming verified if in database
    phoneNumber: patient.phone || "",
    phoneVerified: false, // Default to false
    streetAddressLine1: patient.data?.address?.street || "",
    streetAddressLine2: patient.data?.address?.line2 || "",
    city: patient.data?.address?.city || "",
    state: patient.data?.address?.state || "",
    zipPostalCode: patient.data?.address?.zip_code || "",
    createdAt: patient.created_at,
    updatedAt: patient.updated_at,
  };
}

export function convertFromUserProfile(
  profile: UserProfile,
): Partial<PatientInput> {
  return {
    first_name: profile.firstName,
    last_name: profile.lastName,
    date_of_birth:
      profile.dateOfBirth || new Date().toISOString().split("T")[0],
    phone: profile.phoneNumber,
    email: profile.email,
    data: {
      display_name: profile.displayName,
      sex_at_birth: getGenderStorageValue(profile.gender),
      address: {
        street: profile.streetAddressLine1,
        line2: profile.streetAddressLine2,
        city: profile.city,
        state: getStateName(profile.state),
        zip_code: profile.zipPostalCode,
      },
    },
  };
}
