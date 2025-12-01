"use client";

import { useState, useEffect, useCallback } from "react";
import { verifyCurrentPassword } from "../utils/profileUtils";
import { PROFILE_MESSAGES } from "../constants/constants";
import { createClient } from "@/core/supabase/client";
import { deletePatientAccount } from "../services/patientService.server";
import { patientService } from "../services/patientService.client";
import type {
  UserProfile,
  PersonalInformationFormData,
  PatientData,
  ContactInformationFormData,
} from "../types";
import { convertFromUserProfile, convertToUserProfile } from "../utils";
import { useUser } from "@/core/auth";

export function useProfile() {
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) {
      if (!isUserLoading) {
        setError("No authenticated user found");
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get or create patient record
      const patient = await patientService.getOrCreatePatient(
        user.id,
        user.email || "",
      );

      if (!patient) {
        setError("Failed to load or create patient profile");
        setIsLoading(false);
        return;
      }

      // Convert to UserProfile format
      const userProfile = convertToUserProfile(patient);
      setProfile(userProfile);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  }, [user, isUserLoading]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = patientService.subscribeToPatient(
      user.id,
      (patient: PatientData) => {
        const userProfile = convertToUserProfile(patient);
        setProfile(userProfile);
      },
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Update avatar URL
  const updateAvatarUrl = async (
    avatarUrl: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: "No authenticated user found",
      };
    }
    try {
      const updatedPatient = await patientService.updateAvatarUrl(
        user.id,
        avatarUrl,
      );

      if (!updatedPatient) {
        return {
          success: false,
          message: "Failed to update avatar",
        };
      }

      // Update local state
      const userProfile = convertToUserProfile(updatedPatient);
      setProfile(userProfile);

      return {
        success: true,
        message: "Avatar updated successfully",
      };
    } catch (err) {
      console.error("Error updating avatar:", err);
      return {
        success: false,
        message: "An unexpected error occurred",
      };
    }
  };

  // Update personal information
  const updatePersonalInformation = async (
    personalInfo: PersonalInformationFormData,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: "No authenticated user found",
      };
    }
    try {
      const updatedPatient = await patientService.updatePersonalInformation(
        user.id,
        personalInfo,
      );

      if (!updatedPatient) {
        return {
          success: false,
          message: "Failed to update personal information",
        };
      }

      // Update local state
      const userProfile = convertToUserProfile(updatedPatient);
      setProfile(userProfile);

      return {
        success: true,
        message: "Personal information updated successfully",
      };
    } catch (err) {
      console.error("Error updating personal information:", err);
      return {
        success: false,
        message: "An unexpected error occurred",
      };
    }
  };

  // Update contact information
  const updateContactInformation = async (
    contactInfo: ContactInformationFormData,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: "No authenticated user found",
      };
    }
    try {
      const updatedPatient = await patientService.updateContactInformation(
        user.id,
        contactInfo,
      );

      if (!updatedPatient) {
        return {
          success: false,
          message: "Failed to update contact information",
        };
      }

      // Update local state
      const userProfile = convertToUserProfile(updatedPatient);
      setProfile(userProfile);

      return {
        success: true,
        message: "Contact information updated successfully",
      };
    } catch (err) {
      console.error("Error updating contact information:", err);
      return {
        success: false,
        message: "An unexpected error occurred",
      };
    }
  };

  // Update profile (general)
  const updateProfile = async (
    updates: Partial<UserProfile>,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return {
        success: false,
        message: "No authenticated user found",
      };
    }
    try {
      // Convert UserProfile to database format
      const dbUpdates = convertFromUserProfile(updates as UserProfile);

      const updatedPatient = await patientService.updatePatientByUserId(
        user.id,
        dbUpdates,
      );

      if (!updatedPatient) {
        return {
          success: false,
          message: "Failed to update profile",
        };
      }

      // Update local state
      const userProfile = convertToUserProfile(updatedPatient);
      setProfile(userProfile);

      return {
        success: true,
        message: "Profile updated successfully",
      };
    } catch (err) {
      console.error("Error updating profile:", err);
      return {
        success: false,
        message: "An unexpected error occurred",
      };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    await loadProfile();
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const supabase = createClient();

      // Verify current password
      const isCurrentPasswordValid =
        await verifyCurrentPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: PROFILE_MESSAGES.INVALID_CURRENT_PASSWORD,
        };
      }

      if (currentPassword === newPassword) {
        return {
          success: false,
          message: PROFILE_MESSAGES.SAME_PASSWORD_ERROR,
        };
      }

      if (!user) {
        return {
          success: false,
          message: "No authenticated user found",
        };
      }

      // Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Error updating password:", updateError);
        return {
          success: false,
          message:
            updateError.message || PROFILE_MESSAGES.PASSWORD_CHANGE_ERROR,
        };
      }

      return {
        success: true,
        message: PROFILE_MESSAGES.PASSWORD_CHANGE_SUCCESS,
      };
    } catch (error) {
      console.error("Error changing password:", error);
      return {
        success: false,
        message: PROFILE_MESSAGES.PASSWORD_CHANGE_ERROR,
      };
    }
  };

  const deleteAccount = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const result = await deletePatientAccount();

      if (result.success) {
        // Sign out the user after successful deletion
        const supabase = createClient();
        await supabase.auth.signOut();
      }

      return result;
    } catch (error) {
      console.error("Error deleting account:", error);
      return {
        success: false,
        message: "An unexpected error occurred while deleting account",
      };
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updatePersonalInformation,
    updateAvatarUrl,
    updateContactInformation,
    changePassword,
    deleteAccount,
    refreshProfile,
  };
}
