import { US_STATES } from "./states";

export const PROFILE_CONFIG = {
  STORAGE_KEY: "userProfile",
  DEMO_USER_ID: "demo-user-123",
} as const;

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
] as const;

export const HEIGHT_FEET_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  value: (i + 4).toString(),
  label: `${i + 4}`,
}));

export const HEIGHT_INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: i.toString(),
}));

// Use our local US_STATES and transform to select options format
export const STATE_OPTIONS = US_STATES.map((state) => ({
  value: state.value,
  label: state.label,
}));

export const PROFILE_MESSAGES = {
  SAVE_SUCCESS: "Profile updated successfully",
  SAVE_ERROR: "Failed to update profile. Please try again.",
  PASSWORD_CHANGE_SUCCESS: "Password changed successfully",
  PASSWORD_CHANGE_ERROR: "Failed to change password. Please try again.",
  INVALID_CURRENT_PASSWORD: "Current password is incorrect",
  SAME_PASSWORD_ERROR: "New password cannot be the same as current password",
  PASSWORD_UPDATE_ERROR: "Failed to update password. Please try again.",
  ACCOUNT_DELETE_SUCCESS: "Account deleted successfully",
  ACCOUNT_DELETE_ERROR: "Failed to delete account. Please try again.",
  LOADING: "Loading profile...",
  NOT_FOUND: "Profile not found. Please refresh the page.",
} as const;
