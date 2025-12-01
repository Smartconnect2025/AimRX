"use client";

import { useState, useEffect } from "react";
import { ProviderProfile } from "../types/provider-profile";
import { createClient } from "@core/supabase/client";
import { getNextAvailableSlots } from "../get-next-available-slots";

export function useProviderProfile(providerId: string) {
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProviderProfile() {
      if (!providerId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch comprehensive provider data
        const { data, error } = await supabase
          .from("providers")
          .select(
            `
            id,
            first_name,
            last_name,
            specialty,
            avatar_url,
            professional_bio,
            years_of_experience,
            specialties,
            medical_licenses,
            board_certifications,
            education_training,
            languages_spoken,
            professional_associations,
            services_offered,
            insurance_plans_accepted,
            hospital_affiliations,
            practice_address,
            practice_type,
            licensed_states,
            service_types,
            insurance_plans
          `,
          )
          .eq("id", providerId)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error("Provider not found");
        }

        // Get availability slots
        let nextSlots: string[] = [];
        try {
          nextSlots = await getNextAvailableSlots(providerId);
        } catch (slotError) {
          // Continue without availability slots
          console.warn("Failed to fetch availability slots:", slotError);
        }

        // Transform the data to match our ProviderProfile interface
        const providerProfile: ProviderProfile = {
          ...data,
          availability: {
            status: nextSlots.length > 0 ? "scheduled" : "unavailable",
            nextSlots: nextSlots,
            workingHours: {
              // Default working hours - this could be enhanced with actual schedule data
              monday: { start: "09:00", end: "17:00", isAvailable: true },
              tuesday: { start: "09:00", end: "17:00", isAvailable: true },
              wednesday: { start: "09:00", end: "17:00", isAvailable: true },
              thursday: { start: "09:00", end: "17:00", isAvailable: true },
              friday: { start: "09:00", end: "17:00", isAvailable: true },
              saturday: { start: "10:00", end: "14:00", isAvailable: false },
              sunday: { start: "10:00", end: "14:00", isAvailable: false },
            },
          },
          // Ensure arrays are properly typed and handle both legacy and new fields
          licensedStates: Array.isArray(data.licensed_states)
            ? data.licensed_states
            : data.licensed_states
              ? [data.licensed_states]
              : [],
          serviceTypes: Array.isArray(data.service_types)
            ? data.service_types
            : data.service_types
              ? [data.service_types]
              : [],
          insurancePlans: Array.isArray(data.insurance_plans)
            ? data.insurance_plans
            : data.insurance_plans
              ? [data.insurance_plans]
              : [],
          // Handle structured fields that might be null or objects instead of arrays
          specialties: Array.isArray(data.specialties)
            ? data.specialties
            : data.specialties
              ? [data.specialties]
              : [],
          medical_licenses: Array.isArray(data.medical_licenses)
            ? data.medical_licenses
            : data.medical_licenses
              ? [data.medical_licenses]
              : [],
          board_certifications: Array.isArray(data.board_certifications)
            ? data.board_certifications
            : data.board_certifications
              ? [data.board_certifications]
              : [],
          education_training: Array.isArray(data.education_training)
            ? data.education_training
            : data.education_training
              ? [data.education_training]
              : [],
          languages_spoken: Array.isArray(data.languages_spoken)
            ? data.languages_spoken
            : data.languages_spoken
              ? [data.languages_spoken]
              : [],
          professional_associations: Array.isArray(
            data.professional_associations,
          )
            ? data.professional_associations
            : data.professional_associations
              ? [data.professional_associations]
              : [],
          services_offered: Array.isArray(data.services_offered)
            ? data.services_offered
            : data.services_offered
              ? [data.services_offered]
              : [],
          insurance_plans_accepted: Array.isArray(data.insurance_plans_accepted)
            ? data.insurance_plans_accepted
            : data.insurance_plans_accepted
              ? [data.insurance_plans_accepted]
              : [],
          hospital_affiliations: Array.isArray(data.hospital_affiliations)
            ? data.hospital_affiliations
            : data.hospital_affiliations
              ? [data.hospital_affiliations]
              : [],
          practice_address: data.practice_address || null,
        };

        setProvider(providerProfile);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load provider profile",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchProviderProfile();
  }, [providerId]);

  return {
    provider,
    isLoading,
    error,
  };
}
