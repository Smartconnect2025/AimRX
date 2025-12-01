import { Appointment } from "@/features/bookings/types";

/**
 * Checks if two time ranges overlap
 * @param start1 - Start time of first range
 * @param end1 - End time of first range
 * @param start2 - Start time of second range
 * @param end2 - End time of second range
 * @returns True if the ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  // Two time ranges overlap if: start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
}

/**
 * Checks if a proposed appointment slot conflicts with existing appointments
 * @param proposedStart - Start time of the proposed appointment
 * @param proposedDuration - Duration of the proposed appointment in minutes
 * @param existingAppointments - Array of existing appointments to check against
 * @param _bufferMinutes - Buffer time to add before and after existing appointments (default: 0 - no buffer, unused for backward compatibility)
 * @returns Object with conflict status and details
 */
export function checkAppointmentConflict(
  proposedStart: Date,
  proposedDuration: number,
  existingAppointments: Appointment[],
  _bufferMinutes: number = 0, // Default to no buffer (unused parameter for backward compatibility)
): {
  hasConflict: boolean;
  conflictingAppointment?: Appointment;
  conflictReason?: string;
} {
  const proposedEnd = new Date(
    proposedStart.getTime() + proposedDuration * 60000,
  );

  for (const appointment of existingAppointments) {
    const appointmentStart = new Date(appointment.datetime);
    const appointmentEnd = new Date(
      appointmentStart.getTime() + (appointment.duration || 30) * 60000,
    );

    // Only check for direct overlap - no buffer time
    if (
      timeRangesOverlap(
        proposedStart,
        proposedEnd,
        appointmentStart,
        appointmentEnd,
      )
    ) {
      return {
        hasConflict: true,
        conflictingAppointment: appointment,
        conflictReason: `Conflicts with existing appointment at ${appointment.datetime}`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Finds the next available time slot after a given start time
 * @param startTime - The earliest time to start looking
 * @param duration - Duration of the appointment in minutes
 * @param existingAppointments - Array of existing appointments
 * @param bufferMinutes - Buffer time between appointments
 * @param maxLookAhead - Maximum hours to look ahead (default: 24)
 * @returns Next available start time or null if none found
 */
export function findNextAvailableSlot(
  startTime: Date,
  duration: number,
  existingAppointments: Appointment[],
  bufferMinutes: number = 0, // No buffer by default
  maxLookAhead: number = 24,
): Date | null {
  const maxEndTime = new Date(
    startTime.getTime() + maxLookAhead * 60 * 60 * 1000,
  );
  let currentTime = new Date(startTime);

  // Sort appointments by start time
  const sortedAppointments = [...existingAppointments].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
  );

  while (currentTime < maxEndTime) {
    const conflict = checkAppointmentConflict(
      currentTime,
      duration,
      sortedAppointments,
      bufferMinutes,
    );

    if (!conflict.hasConflict) {
      return currentTime;
    }

    if (conflict.conflictingAppointment) {
      // Move to after the conflicting appointment (no buffer)
      const conflictStart = new Date(conflict.conflictingAppointment.datetime);
      const conflictEnd = new Date(
        conflictStart.getTime() +
          (conflict.conflictingAppointment.duration || 30) * 60000,
      );
      currentTime = new Date(conflictEnd.getTime());
    } else {
      // Move forward by 30 minutes if no specific conflict found
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }
  }

  return null; // No available slot found within the time limit
}
