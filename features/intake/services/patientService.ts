import { createClient } from "@core/supabase/client";
import { format } from "date-fns";
import { PatientInformationFormValues } from "../schemas";

export interface PatientIntakeData {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email?: string;
  data?: Record<string, unknown>;
}

export const intakePatientService = {
  // Load existing patient information
  async getPatientInformation(userId: string): Promise<{
    success: boolean;
    data?: PatientInformationFormValues;
    error?: string;
  }> {
    const supabase = createClient();

    try {
      const { data: patient, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle() to handle 0 rows

      if (error) {
        if (error.code === "PGRST116") {
          // No patient found - this is not an error for new users
          return { success: true, data: undefined };
        }
        return { success: false, error: error.message };
      }

      if (!patient) {
        return { success: true, data: undefined };
      }

      // Check if we have the required data to construct a valid form object
      if (!patient.date_of_birth || !patient.data?.sex_at_birth) {
        return { success: true, data: undefined };
      }

      // Map database structure back to form values
      const formData: PatientInformationFormValues = {
        firstName: patient.first_name || "",
        lastName: patient.last_name || "",
        dateOfBirth: new Date(patient.date_of_birth),
        sexAtBirth: patient.data.sex_at_birth as "male" | "female",
        address: {
          street: patient.data?.address?.street || "",
          city: patient.data?.address?.city || "",
          state: patient.data?.address?.state || "",
          zipCode: patient.data?.address?.zip_code || "",
        },
        contact: {
          phone: patient.phone || "",
        },
        preferredLanguage:
          (patient.data?.preferred_language as "english" | "spanish") ||
          "english",
        height: {
          feet: patient.data?.height?.feet || 5,
          inches: patient.data?.height?.inches || 8,
        },
        weight: patient.data?.weight || undefined,
      };

      return { success: true, data: formData };
    } catch (error) {
      console.error("Error loading patient information:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },

  // Save patient information from intake form
  async savePatientInformation(
    userId: string,
    formData: PatientInformationFormValues,
  ): Promise<{ success: boolean; patientId?: string; error?: string }> {
    const supabase = createClient();

    try {
      // Get authenticated user's email
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userEmail = user?.email || undefined;

      // Map form data to database structure
      const patientData: Omit<PatientIntakeData, "id"> = {
        user_id: userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: format(formData.dateOfBirth, "yyyy-MM-dd"),
        phone: formData.contact.phone,
        email: userEmail,
        data: {
          sex_at_birth: formData.sexAtBirth,
          address: {
            street: formData.address.street,
            city: formData.address.city,
            state: formData.address.state,
            zip_code: formData.address.zipCode,
          },
          preferred_language: formData.preferredLanguage,
          height: {
            feet: formData.height.feet,
            inches: formData.height.inches,
          },
          weight: formData.weight,
          intake_step: "patient_information_completed",
        },
      };

      // Check if patient already exists for this user
      const { data: existingPatient, error: findError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle() to handle 0 rows

      if (existingPatient && !findError) {
        // Update existing patient
        const { error: updateError } = await supabase
          .from("patients")
          .update(patientData)
          .eq("id", existingPatient.id)
          .eq("is_active", true);

        if (updateError) {
          console.error("Error updating patient:", updateError);
          return { success: false, error: updateError.message };
        }

        return { success: true, patientId: existingPatient.id };
      } else {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from("patients")
          .insert([patientData])
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating patient:", createError);
          return { success: false, error: createError.message };
        }

        return { success: true, patientId: newPatient.id };
      }
    } catch (error) {
      console.error("Error in savePatientInformation:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },

  // Update patient data with additional intake information
  async updatePatientData(
    userId: string,
    additionalData: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    try {
      // Get existing patient
      const { data: patient, error: findError } = await supabase
        .from("patients")
        .select("data")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle() to handle 0 rows

      if (findError || !patient) {
        return { success: false, error: "Patient not found" };
      }

      // Merge existing data with new data
      const updatedData = {
        ...patient.data,
        ...additionalData,
      };

      // Update patient
      const { error: updateError } = await supabase
        .from("patients")
        .update({ data: updatedData })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (updateError) {
        console.error("Error updating patient data:", updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updatePatientData:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },

  // Mark intake as completed
  async markIntakeCompleted(
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.updatePatientData(userId, {
      intake_completed_at: new Date().toISOString(),
      intake_step: "completed",
    });
  },
};
