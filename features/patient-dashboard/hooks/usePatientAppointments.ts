import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@core/supabase/client";
import { useUser } from "@core/auth";
import { AppointmentWithProvider } from "@/features/bookings/types";

export type PatientAppointment = AppointmentWithProvider;

export function usePatientAppointments() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<
    PatientAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pastLoading, setPastLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pastError, setPastError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const fetchedForPatientIdRef = useRef<string | null>(null);

  // Get patient ID from user ID
  const fetchPatientId = useCallback(async () => {
    if (!user?.id) return null;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(); // Use maybeSingle() to handle 0 rows

    if (error) {
      console.error("Error fetching patient:", error);
      return null;
    }

    return data?.id || null;
  }, [user?.id]);

  // Fetch past appointments for the patient (last 24 hours)
  const fetchPastAppointments = useCallback(async () => {
    if (!patientId) {
      setPastAppointments([]);
      setPastLoading(false);
      return;
    }

    setPastLoading(true);
    setPastError(null);
    const supabase = createClient();

    try {
      // Calculate 24 hours ago
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Step 1: Fetch past appointments
      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .gte("datetime", twentyFourHoursAgo.toISOString())
          .lt("datetime", new Date().toISOString())
          .order("datetime", { ascending: false });

      if (appointmentsError) {
        console.error("Error fetching past appointments:", appointmentsError);
        setPastError(appointmentsError.message);
        setPastAppointments([]);
        return;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        setPastAppointments([]);
        return;
      }

      // Step 2: Get unique provider IDs from appointments
      const providerIds = [
        ...new Set(appointmentsData.map((a) => a.provider_id)),
      ].filter(Boolean);

      if (providerIds.length === 0) {
        const appointmentsWithPlaceholder = appointmentsData.map(
          (appointment) => ({
            ...appointment,
            provider: {
              id: appointment.provider_id || "unknown",
              first_name: "Unknown",
              last_name: "Provider",
              specialty: "General Practice",
              avatar_url: undefined,
            },
          }),
        );
        setPastAppointments(
          appointmentsWithPlaceholder as PatientAppointment[],
        );
        return;
      }

      // Step 3: Fetch all providers for these IDs
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, first_name, last_name, specialty, avatar_url")
        .in("id", providerIds);

      if (providersError) {
        console.error(
          "Error fetching providers for past appointments:",
          providersError,
        );
        setPastError(providersError.message);
        setPastAppointments([]);
        return;
      }

      const providersMap = new Map(
        (providersData || []).map((provider) => [provider.id, provider]),
      );

      const appointmentsWithProviders = appointmentsData.map((appointment) => {
        const provider = providersMap.get(appointment.provider_id);
        return {
          ...appointment,
          provider: provider || {
            id: appointment.provider_id || "unknown",
            first_name: "Unknown",
            last_name: "Provider",
            specialty: "General Practice",
            avatar_url: undefined,
          },
        };
      });

      setPastAppointments(appointmentsWithProviders as PatientAppointment[]);
    } catch (err) {
      console.error("Error fetching past appointments:", err);
      setPastError(
        err instanceof Error
          ? err.message
          : "Failed to fetch past appointments",
      );
      setPastAppointments([]);
    } finally {
      setPastLoading(false);
    }
  }, [patientId]);

  // Fetch appointments for the patient
  const fetchAppointments = useCallback(async () => {
    if (!patientId) {
      setAppointments([]);
      setLoading(false); // Ensure loading is false if no patientId
      fetchedForPatientIdRef.current = null;
      return;
    }

    // Prevent refetch if data for this patientId already exists and appointments are loaded
    if (
      fetchedForPatientIdRef.current === patientId &&
      appointments.length > 0
    ) {
      setLoading(false); // Ensure loading is false as we are not fetching
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // Step 1: Fetch appointments
      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .gte("datetime", new Date().toISOString())
          .order("datetime", { ascending: true });

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        setError(appointmentsError.message);
        setAppointments([]);
        fetchedForPatientIdRef.current = null; // Reset on error
        return;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        fetchedForPatientIdRef.current = patientId; // Mark as fetched for this patientId, even if no data
        setLoading(false); // Ensure loading is set to false when no appointments
        return;
      }

      // Step 2: Get unique provider IDs from appointments
      const providerIds = [
        ...new Set(appointmentsData.map((a) => a.provider_id)),
      ].filter(Boolean);

      if (providerIds.length === 0) {
        const appointmentsWithPlaceholder = appointmentsData.map(
          (appointment) => ({
            ...appointment,
            provider: {
              id: appointment.provider_id || "unknown",
              first_name: "Unknown",
              last_name: "Provider",
              specialty: "General Practice",
              avatar_url: undefined,
            },
          }),
        );
        setAppointments(appointmentsWithPlaceholder as PatientAppointment[]);
        fetchedForPatientIdRef.current = patientId;
        setLoading(false); // Ensure loading is set to false
        return;
      }

      // Step 3: Fetch all providers for these IDs
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, first_name, last_name, specialty, avatar_url")
        .in("id", providerIds);

      if (providersError) {
        console.error("Error fetching providers:", providersError);
        setError(providersError.message);
        setAppointments([]);
        fetchedForPatientIdRef.current = null; // Reset on error
        return;
      }

      const providersMap = new Map(
        (providersData || []).map((provider) => [provider.id, provider]),
      );

      const appointmentsWithProviders = appointmentsData.map((appointment) => {
        const provider = providersMap.get(appointment.provider_id);
        return {
          ...appointment,
          provider: provider || {
            id: appointment.provider_id || "unknown",
            first_name: "Unknown",
            last_name: "Provider",
            specialty: "General Practice",
            avatar_url: undefined,
          },
        };
      });

      setAppointments(appointmentsWithProviders as PatientAppointment[]);
      fetchedForPatientIdRef.current = patientId; // Store patientId after successful fetch
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch appointments",
      );
      setAppointments([]);
      fetchedForPatientIdRef.current = null; // Reset on catch
    } finally {
      setLoading(false);
    }
  }, [patientId, appointments.length]); // Added appointments.length

  // Initialize patient ID
  useEffect(() => {
    const initializeData = async () => {
      if (!user?.id) {
        setPatientId(null); // Clear patientId if user logs out
        setAppointments([]); // Clear appointments
        fetchedForPatientIdRef.current = null; // Reset ref
        setLoading(false);
        return;
      }

      // Only fetch patientId if it's not already set or user changed
      if (
        patientId === null ||
        user.id !== fetchedForPatientIdRef.current?.split("_")[0]
      ) {
        // Simple check if user changed
        setLoading(true); // Set loading before fetching patientId
        const fetchedPatientIdValue = await fetchPatientId();
        if (fetchedPatientIdValue) {
          setPatientId(fetchedPatientIdValue);
          // fetchAppointments will be triggered by patientId change
        } else {
          setError("Patient not found for current user");
          setPatientId(null); // Ensure patientId is null if not found
          setAppointments([]);
          fetchedForPatientIdRef.current = null;
          setLoading(false); // Set loading false if patient not found
        }
      }
    };

    initializeData();
  }, [user?.id, fetchPatientId, patientId]); // patientId is needed here to re-evaluate if it was null and user.id appears

  // Fetch appointments when patient ID is available or changes
  useEffect(() => {
    fetchAppointments();
    fetchPastAppointments();
  }, [fetchAppointments, fetchPastAppointments]); // fetchAppointments callback now has the logic

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) {
        setError(error.message);
        return false;
      } else {
        // Remove from local state
        setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
        return true;
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to cancel appointment",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    appointments,
    pastAppointments,
    loading,
    pastLoading,
    error,
    pastError,
    patientId,
    fetchAppointments,
    fetchPastAppointments,
    cancelAppointment,
  };
}
