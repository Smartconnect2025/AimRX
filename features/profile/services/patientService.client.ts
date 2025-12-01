import { createClient } from "@/core/supabase/client";
import type {
  PatientData,
  PatientInput,
  PersonalInformationFormData,
  ContactInformationFormData,
} from "../types";

import { getStateName } from "../constants/states";
import { getGenderStorageValue } from "../utils";

export const patientService = {
  async getPatientByUserId(userId: string): Promise<PatientData | null> {
    if (!userId) return null;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(); // Use maybeSingle() to handle 0 rows

    if (error || !data) return null;

    return data as PatientData;
  },

  async getOrCreatePatient(
    userId: string,
    email: string,
  ): Promise<PatientData | null> {
    if (!userId || !email) return null;

    // Try to get existing active patient
    const patient = await this.getPatientByUserId(userId);

    if (patient && patient.is_active) return patient;

    // If patient exists but is inactive, don't allow access
    if (patient && !patient.is_active) {
      return null;
    }

    // Create new patient if doesn't exist
    const newPatientInput: PatientInput = {
      first_name: "",
      last_name: "",
      date_of_birth: new Date().toISOString().split("T")[0], // Default to today
      email: email,
      user_id: userId,
      data: {},
      is_active: true,
    };

    return await this.createPatient(newPatientInput);
  },

  async createPatient(input: PatientInput): Promise<PatientData | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("patients")
      .insert([input])
      .select()
      .single();

    if (error || !data) return null;

    return data as PatientData;
  },

  async updatePatientByUserId(
    userId: string,
    updates: Partial<PatientInput>,
  ): Promise<PatientData | null> {
    if (!userId) return null;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("patients")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_active", true)
      .select()
      .single();

    if (error || !data) return null;

    return data as PatientData;
  },

  async updatePersonalInformation(
    userId: string,
    personalInfo: PersonalInformationFormData,
  ): Promise<PatientData | null> {
    if (!userId) return null;
    const supabase = createClient();

    // First, get the current patient data to preserve existing data
    const currentPatient = await this.getPatientByUserId(userId);
    if (!currentPatient) return null;

    // Merge with existing data to preserve other fields
    const existingData = currentPatient.data || {};
    const updatedData = {
      ...existingData,
      display_name: personalInfo.displayName,
      sex_at_birth: getGenderStorageValue(personalInfo.gender),
    };

    // Convert form data to database format
    const updates = {
      first_name: personalInfo.firstName,
      last_name: personalInfo.lastName,
      date_of_birth: personalInfo.dateOfBirth,
      avatar_url: personalInfo.avatarUrl,
      data: updatedData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("patients")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .maybeSingle(); // Use maybeSingle() to handle 0 rows

    if (error || !data) return null;

    return data as PatientData;
  },

  async updateAvatarUrl(
    userId: string,
    avatarUrl: string,
  ): Promise<PatientData | null> {
    if (!userId) return null;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("patients")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error || !data) return null;

    return data as PatientData;
  },

  async updateContactInformation(
    userId: string,
    contactInfo: ContactInformationFormData,
  ): Promise<PatientData | null> {
    if (!userId) return null;
    const supabase = createClient();

    // First, get the current patient data to preserve existing data
    const currentPatient = await this.getPatientByUserId(userId);
    if (!currentPatient) return null;

    // Merge with existing data to preserve other fields
    const existingData = currentPatient.data || {};
    const existingAddress = existingData.address || {};

    const updatedData = {
      ...existingData,
      address: {
        ...existingAddress,
        street: contactInfo.streetAddressLine1,
        line2: contactInfo.streetAddressLine2,
        city: contactInfo.city,
        state: getStateName(contactInfo.state),
        zip_code: contactInfo.zipPostalCode,
      },
    };

    // Convert form data to database format
    const updates = {
      phone: contactInfo.phoneNumber,
      email: contactInfo.email,
      data: updatedData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("patients")
      .update(updates)
      .eq("user_id", userId)
      .eq("is_active", true)
      .select()
      .maybeSingle(); // Use maybeSingle() to handle 0 rows

    if (error || !data) return null;

    return data as PatientData;
  },

  subscribeToPatient(
    userId: string,
    callback: (patient: PatientData) => void,
  ): () => void {
    const supabase = createClient();

    const subscription = supabase
      .channel(`patient_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patients",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as PatientData);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
