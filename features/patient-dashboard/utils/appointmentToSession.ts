import { Session } from "@/features/telehealth/types/session";
import { PatientAppointment } from "../hooks/usePatientAppointments";
import { format } from "date-fns";

/**
 * Converts a database appointment to a Session object for the SessionsList component
 */
export function appointmentToSession(appointment: PatientAppointment): Session {
  const appointmentDate = new Date(appointment.datetime);

  return {
    id: appointment.id,
    provider: {
      id: appointment.provider.id,
      first_name: appointment.provider.first_name,
      last_name: appointment.provider.last_name,
      specialty: appointment.provider.specialty,
      credentials: "", // Default empty string since providers table doesn't have credentials
      photoUrl: appointment.provider.avatar_url || undefined,
    },
    date: format(appointmentDate, "MMMM d, yyyy"),
    time: format(appointmentDate, "h:mm a"),
    duration: appointment.duration,
    type: appointment.type,
    status: "upcoming", // Default status since we're not using status logic
    timeToStart: undefined, // Not using timeToStart anymore
    reason: appointment.reason, // Include the appointment reason
  };
}

/**
 * Converts an array of appointments to sessions
 */
export function appointmentsToSessions(
  appointments: PatientAppointment[],
): Session[] {
  return appointments.map(appointmentToSession);
}
