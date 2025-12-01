import { useEffect, useState, useCallback } from "react";
import { createClient } from "@core/supabase/client";
import { Appointment, AppointmentWithProvider } from "../types";
import { patientService } from "../services/patientService";
import { validateAppointmentCreation } from "../utils/appointmentValidation";
import { toast } from "sonner";
import { appointmentEncounterService } from "@/features/basic-emr/services/appointmentEncounterService";

export function useAppointments(userId: string | null, userEmail?: string) {
  const [appointments, setAppointments] = useState<AppointmentWithProvider[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Get existing patient ID when user info is available
  useEffect(() => {
    const initializePatient = async () => {
      if (!userId || !userEmail) return;

      const id = await patientService.getPatientByUser(userId, userEmail);
      setPatientId(id);
    };

    initializePatient();
  }, [userId, userEmail]);

  const fetchAppointments = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Fetch appointments from the appointments table
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        provider:providers(*)
      `,
      )
      .eq("patient_id", patientId)
      .order("datetime", { ascending: false });

    if (error) {
      setError(error.message);
      setAppointments([]);
    } else {
      setAppointments(data as AppointmentWithProvider[]);
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = useCallback(
    async (
      appointment: Omit<Appointment, "id" | "created_at" | "updated_at">,
    ) => {
      setLoading(true);
      setError(null);

      // Validate appointment before creating
      const validation = await validateAppointmentCreation(
        appointment.provider_id,
        appointment.patient_id,
        appointment.datetime,
        appointment.duration,
      );

      if (!validation.isValid) {
        setError(validation.error || "Appointment validation failed");
        toast.error(
          validation.error || "Cannot create appointment at this time",
        );
        setLoading(false);
        return null;
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from("appointments")
        .insert([appointment])
        .select(
          `
          *,
          provider:providers(*)
        `,
        )
        .single();

      if (error) {
        setError(error.message);
        toast.error("Failed to create appointment");
        setLoading(false);
        return null;
      } else {
        // Automatically create an encounter for this appointment
        if (userId) {
          try {
            // Check if this is a coaching appointment
            const isCoachingAppointment =
              data.type === "coaching" ||
              data.reason?.toLowerCase().includes("coaching");

            let encounterResult;

            if (isCoachingAppointment) {
              // Use coaching encounter service for coaching appointments
              const { coachingEncounterService } = await import(
                "@/features/basic-emr/services/coachingEncounterService"
              );
              encounterResult =
                await coachingEncounterService.createEncounterFromAppointment(
                  userId,
                  {
                    id: data.id,
                    patientId: data.patient_id,
                    providerId: data.provider_id,
                    sessionDate: data.datetime,
                    title: data.reason,
                    status: "scheduled",
                  },
                );
            } else {
              // Use regular appointment encounter service for clinical appointments
              encounterResult =
                await appointmentEncounterService.createEncounterFromAppointment(
                  userId,
                  {
                    id: data.id,
                    reference: data.id,
                    patientId: data.patient_id,
                    providerId: data.provider_id,
                    appointmentDate: data.datetime,
                    title: data.reason,
                    status: "scheduled",
                  },
                );
            }

            if (encounterResult.success) {
              toast("Appointment and encounter created successfully.");
            } else {
              toast.warning(
                "Appointment created but failed to create linked encounter.",
              );
            }
          } catch (encounterError) {
            console.error("Error creating encounter:", encounterError);
            toast.warning(
              "Appointment created but failed to create linked encounter.",
            );
          }
        }

        setAppointments((prev) => [data as AppointmentWithProvider, ...prev]);
        setLoading(false);
        return data as AppointmentWithProvider;
      }
    },
    [userId],
  );

  const deleteAppointment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // First, find and delete any linked encounter
      const { data: encounterData } = await supabase
        .from("encounters")
        .select("id")
        .eq("appointment_id", id)
        .limit(1);

      const encounter =
        encounterData && encounterData.length > 0 ? encounterData[0] : null;

      if (encounter) {
        const { error: encounterError } = await supabase
          .from("encounters")
          .delete()
          .eq("id", encounter.id);

        if (encounterError) {
          console.error("Error deleting linked encounter:", encounterError);
          // Continue with appointment deletion even if encounter deletion fails
        }
      }

      // Then delete the appointment
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) {
        setError(error.message);
        setLoading(false);
        return false;
      } else {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        setLoading(false);
        return true;
      }
    } catch (error) {
      console.error("Error in deleteAppointment:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setLoading(false);
      return false;
    }
  }, []);

  const updateAppointment = useCallback(
    async (id: string, updates: Partial<Appointment>) => {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          provider:providers(*)
        `,
        )
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return null;
      } else {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === id ? (data as AppointmentWithProvider) : a,
          ),
        );
        toast("Appointment updated successfully.");
        setLoading(false);
        return data as AppointmentWithProvider;
      }
    },
    [],
  );

  return {
    appointments,
    loading,
    error,
    patientId,
    fetchAppointments,
    createAppointment,
    deleteAppointment,
    updateAppointment,
  };
}
