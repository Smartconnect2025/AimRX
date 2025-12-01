import { createClient } from "@core/supabase/client";
import type { InsertPatient } from "@/core/database/schema";

export type PatientData = InsertPatient;

export const patientService = {
  // Get existing patient record for a user (no auto-creation)
  async getPatientByUser(
    userId: string,
    userEmail: string,
  ): Promise<string | null> {
    const supabase = createClient();

    try {
      // Try to find existing patient by user_id or email
      const { data: existingPatient, error: findError } = await supabase
        .from("patients")
        .select("id")
        .or(`user_id.eq.${userId},email.eq.${userEmail}`)
        .eq("is_active", true)
        .single();

      if (existingPatient && !findError) {
        return existingPatient.id;
      }

      // No patient found - user needs to complete intake
      return null;
    } catch (error) {
      console.error("Error in getPatientByUser:", error);
      return null;
    }
  },

  // Create a patient record (for intake process)
  async createPatient(
    userId: string,
    patientData: Omit<PatientData, "id" | "user_id">,
  ): Promise<string | null> {
    const supabase = createClient();

    try {
      const { data: newPatient, error: createError } = await supabase
        .from("patients")
        .insert([
          {
            user_id: userId, // Link to the auth user
            first_name: patientData.first_name,
            last_name: patientData.last_name,
            date_of_birth: patientData.date_of_birth,
            phone: patientData.phone,
            email: patientData.email,
            data: patientData.data || {},
          },
        ])
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating patient:", createError);
        return null;
      }

      return newPatient.id;
    } catch (error) {
      console.error("Error in createPatient:", error);
      return null;
    }
  },

  // Get patient details
  async getPatient(patientId: string): Promise<PatientData | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching patient:", error);
      return null;
    }

    return data;
  },

  // Update patient information
  async updatePatient(
    patientId: string,
    updates: Partial<PatientData>,
  ): Promise<boolean> {
    const supabase = createClient();

    const { error } = await supabase
      .from("patients")
      .update(updates)
      .eq("id", patientId)
      .eq("is_active", true);

    if (error) {
      console.error("Error updating patient:", error);
      return false;
    }

    return true;
  },
};
