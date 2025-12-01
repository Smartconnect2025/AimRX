import { createClient } from "@core/supabase/client";
import { format } from "date-fns";
import type { MedicalHistoryFormValues } from "../schemas/medical-history";

export const medicalHistoryService = {
  // Get patient ID from user ID
  async getPatientId(userId: string): Promise<string | null> {
    const supabase = createClient();

    try {
      const { data: patient, error } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(); // Use maybeSingle() to handle 0 rows

      if (error || !patient) {
        return null;
      }

      return patient.id;
    } catch (error) {
      console.error("Error getting patient ID:", error);
      return null;
    }
  },

  // Save medical history to database
  async saveMedicalHistory(
    userId: string,
    formData: MedicalHistoryFormValues,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    try {
      const patientId = await this.getPatientId(userId);
      if (!patientId) {
        return { success: false, error: "Patient not found" };
      }

      // Delete existing medical history for this patient to replace with new data
      await Promise.all([
        supabase.from("conditions").delete().eq("patient_id", patientId),
        supabase.from("medications").delete().eq("patient_id", patientId),
        supabase.from("allergies").delete().eq("patient_id", patientId),
      ]);

      // Insert new conditions
      if (formData.conditions.length > 0) {
        const conditionsToInsert = formData.conditions.map((condition) => ({
          patient_id: patientId,
          name: condition.name,
          onset_date: format(condition.onsetDate, "yyyy-MM-dd"),
          status: condition.currentStatus.toLowerCase(),
          severity: condition.severity.toLowerCase(),
          notes: condition.notes || null,
        }));

        const { error: conditionsError } = await supabase
          .from("conditions")
          .insert(conditionsToInsert);

        if (conditionsError) {
          throw new Error(
            `Failed to save conditions: ${conditionsError.message}`,
          );
        }
      }

      // Insert new medications
      if (formData.medications.length > 0) {
        const medicationsToInsert = formData.medications.map((medication) => ({
          patient_id: patientId,
          name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          start_date: format(medication.startDate, "yyyy-MM-dd"),
          status: medication.currentStatus.toLowerCase(),
        }));

        const { error: medicationsError } = await supabase
          .from("medications")
          .insert(medicationsToInsert);

        if (medicationsError) {
          throw new Error(
            `Failed to save medications: ${medicationsError.message}`,
          );
        }
      }

      // Insert new allergies
      if (formData.allergies.length > 0) {
        const allergiesToInsert = formData.allergies.map((allergy) => ({
          patient_id: patientId,
          allergen: allergy.allergen,
          reaction_type: allergy.reaction,
          severity: allergy.severity.toLowerCase(),
        }));

        const { error: allergiesError } = await supabase
          .from("allergies")
          .insert(allergiesToInsert);

        if (allergiesError) {
          throw new Error(
            `Failed to save allergies: ${allergiesError.message}`,
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error saving medical history:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save medical history",
      };
    }
  },

  // Load existing medical history from database
  async loadMedicalHistory(userId: string): Promise<{
    success: boolean;
    data?: MedicalHistoryFormValues;
    error?: string;
  }> {
    const supabase = createClient();

    try {
      const patientId = await this.getPatientId(userId);
      if (!patientId) {
        return { success: true, data: undefined }; // No patient found, return empty
      }

      // Fetch all medical history data
      const [conditionsResult, medicationsResult, allergiesResult] =
        await Promise.all([
          supabase.from("conditions").select("*").eq("patient_id", patientId),
          supabase.from("medications").select("*").eq("patient_id", patientId),
          supabase.from("allergies").select("*").eq("patient_id", patientId),
        ]);

      // Check for errors
      if (conditionsResult.error) {
        throw new Error(
          `Failed to load conditions: ${conditionsResult.error.message}`,
        );
      }
      if (medicationsResult.error) {
        throw new Error(
          `Failed to load medications: ${medicationsResult.error.message}`,
        );
      }
      if (allergiesResult.error) {
        throw new Error(
          `Failed to load allergies: ${allergiesResult.error.message}`,
        );
      }

      // Transform database data to form format
      const formData: MedicalHistoryFormValues = {
        conditions: (conditionsResult.data || []).map((condition) => ({
          name: condition.name,
          onsetDate: new Date(condition.onset_date),
          currentStatus: condition.status === "active" ? "Active" : "Resolved",
          severity: (condition.severity.charAt(0).toUpperCase() +
            condition.severity.slice(1)) as "Mild" | "Moderate" | "Severe",
          notes: condition.notes || "",
        })),
        medications: (medicationsResult.data || []).map((medication) => ({
          name: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          startDate: new Date(medication.start_date),
          currentStatus: medication.status === "active" ? "Active" : "Resolved", // Map discontinued to Resolved
        })),
        allergies: (allergiesResult.data || []).map((allergy) => ({
          allergen: allergy.allergen,
          reaction: allergy.reaction_type,
          severity: (allergy.severity.charAt(0).toUpperCase() +
            allergy.severity.slice(1)) as "Mild" | "Moderate" | "Severe",
        })),
      };

      return { success: true, data: formData };
    } catch (error) {
      console.error("Error loading medical history:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load medical history",
      };
    }
  },
};
