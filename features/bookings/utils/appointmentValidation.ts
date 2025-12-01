import { createClient } from "@core/supabase/client";
import { Appointment } from "@/features/bookings/types";
import { checkAppointmentConflict } from "@/features/provider-search/utils/appointmentConflicts";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type {
  ProviderAvailability,
  ProviderAvailabilityException,
} from "@/core/database/schema";

/**
 * Validates if an appointment can be created without conflicts
 * @param providerId - ID of the provider
 * @param patientId - ID of the patient
 * @param datetime - Proposed appointment datetime
 * @param duration - Duration in minutes
 * @param bufferMinutes - Buffer time between appointments (default: 0 - no buffer)
 * @returns Validation result with conflict details
 */
export async function validateAppointmentCreation(
  providerId: string,
  patientId: string,
  datetime: string,
  duration: number,
  bufferMinutes: number = 0, // No buffer time
): Promise<{
  isValid: boolean;
  error?: string;
  conflictingAppointment?: Appointment;
}> {
  const supabase = createClient();
  const proposedStart = new Date(datetime);
  const proposedEnd = new Date(proposedStart.getTime() + duration * 60000);

  // Validate that the appointment is in the future
  if (proposedStart <= new Date()) {
    return {
      isValid: false,
      error: "Appointment must be scheduled for a future time",
    };
  }

  try {
    // Check for provider conflicts
    const { data: providerAppointments, error: providerError } = await supabase
      .from("appointments")
      .select("*")
      .eq("provider_id", providerId)
      .gte(
        "datetime",
        new Date(proposedStart.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      ) // 24 hours before
      .lte(
        "datetime",
        new Date(proposedEnd.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      ); // 24 hours after

    if (providerError) {
      return {
        isValid: false,
        error: `Error checking provider availability: ${providerError.message}`,
      };
    }

    const providerConflict = checkAppointmentConflict(
      proposedStart,
      duration,
      (providerAppointments as Appointment[]) || [],
      bufferMinutes,
    );

    if (providerConflict.hasConflict) {
      return {
        isValid: false,
        error: `Provider is not available at this time: ${providerConflict.conflictReason}`,
        conflictingAppointment: providerConflict.conflictingAppointment,
      };
    }

    // Check for patient conflicts
    const { data: patientAppointments, error: patientError } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .gte(
        "datetime",
        new Date(proposedStart.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      ) // 24 hours before
      .lte(
        "datetime",
        new Date(proposedEnd.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      ); // 24 hours after

    if (patientError) {
      return {
        isValid: false,
        error: `Error checking patient availability: ${patientError.message}`,
      };
    }

    const patientConflict = checkAppointmentConflict(
      proposedStart,
      duration,
      (patientAppointments as Appointment[]) || [],
      bufferMinutes,
    );

    if (patientConflict.hasConflict) {
      return {
        isValid: false,
        error: `You already have an appointment at this time: ${patientConflict.conflictReason}`,
        conflictingAppointment: patientConflict.conflictingAppointment,
      };
    }

    // Validate against provider availability schedule
    const availabilityValidation = await validateProviderAvailability(
      providerId,
      proposedStart,
      duration,
    );

    if (!availabilityValidation.isValid) {
      return availabilityValidation;
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Validation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Suggests alternative appointment times if the requested time is not available
 * @param providerId - ID of the provider
 * @param requestedDatetime - Originally requested datetime
 * @param duration - Duration in minutes
 * @param maxSuggestions - Maximum number of alternative times to suggest (default: 3)
 * @returns Array of suggested alternative times
 */
export async function suggestAlternativeAppointmentTimes(
  providerId: string,
  requestedDatetime: string,
  duration: number,
  maxSuggestions: number = 3,
): Promise<string[]> {
  const supabase = createClient();
  const requestedStart = new Date(requestedDatetime);
  const suggestions: string[] = [];

  try {
    // Get provider's existing appointments for the next 7 days
    const searchEndDate = new Date(
      requestedStart.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("provider_id", providerId)
      .gte("datetime", requestedStart.toISOString())
      .lte("datetime", searchEndDate.toISOString());

    const existingAppointments = (appointments as Appointment[]) || [];

    // Try to find alternative times
    // Start from the requested time and look for next available slots
    let currentTime = new Date(requestedStart);
    const maxAttempts = 50; // Prevent infinite loops
    let attempts = 0;

    while (suggestions.length < maxSuggestions && attempts < maxAttempts) {
      const conflict = checkAppointmentConflict(
        currentTime,
        duration,
        existingAppointments,
        15,
      );

      if (!conflict.hasConflict) {
        // Check if this time is within business hours (9 AM to 5 PM)
        const hour = currentTime.getHours();
        if (hour >= 9 && hour < 17) {
          suggestions.push(currentTime.toISOString());
        }
      }

      // Move to next 30-minute slot
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
      attempts++;
    }

    return suggestions;
  } catch (error) {
    console.error("Error suggesting alternative times:", error);
    return [];
  }
}

/**
 * Validates if a proposed appointment time falls within provider's availability
 * @param providerId - ID of the provider
 * @param proposedStart - Proposed appointment start time
 * @param duration - Duration in minutes
 * @returns Validation result
 */
async function validateProviderAvailability(
  providerId: string,
  proposedStart: Date,
  duration: number,
): Promise<{
  isValid: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const proposedEnd = new Date(proposedStart.getTime() + duration * 60000);

  try {
    // Get provider's base availability
    const { data: baseAvailability, error: availabilityError } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId);

    if (availabilityError) {
      return {
        isValid: false,
        error: `Error checking provider availability: ${availabilityError.message}`,
      };
    }

    // If no availability data, provider is not available
    if (!baseAvailability || baseAvailability.length === 0) {
      return {
        isValid: false,
        error: "Provider has no availability configured",
      };
    }

    // Get provider's timezone from availability data
    const providerTimezone = baseAvailability[0]?.provider_timezone || "UTC";

    // Convert proposed times to provider's timezone for comparison
    const proposedStartInProviderTz = toZonedTime(
      proposedStart,
      providerTimezone,
    );
    const proposedEndInProviderTz = toZonedTime(proposedEnd, providerTimezone);

    // Convert JavaScript day (0=Sunday) to DB format (0=Monday, 6=Sunday)
    const jsDay = proposedStartInProviderTz.getDay();
    const dbDay = jsDay === 0 ? 6 : jsDay - 1;

    // Find availability for the proposed day
    const dayAvailabilities = (
      baseAvailability as ProviderAvailability[]
    ).filter((a) => a.day_of_week === dbDay);

    if (dayAvailabilities.length === 0) {
      return {
        isValid: false,
        error: "Provider is not available on this day of the week",
      };
    }

    // Check if the proposed time falls within any availability window
    // Format times in provider's timezone for comparison (with seconds to match DB format)
    const proposedTime = format(proposedStartInProviderTz, "HH:mm:ss");
    const proposedEndTime = format(proposedEndInProviderTz, "HH:mm:ss");

    let isWithinAvailableHours = false;
    for (const avail of dayAvailabilities) {
      if (
        proposedTime >= avail.start_time &&
        proposedEndTime <= avail.end_time
      ) {
        isWithinAvailableHours = true;
        break;
      }
    }

    if (!isWithinAvailableHours) {
      return {
        isValid: false,
        error: "Proposed time is outside provider's available hours",
      };
    }

    // Check for availability exceptions on this specific date
    // Use the date in provider's timezone for exception checking
    const dateString = format(proposedStartInProviderTz, "yyyy-MM-dd");
    const { data: exceptions } = await supabase
      .from("provider_availability_exceptions")
      .select("*")
      .eq("provider_id", providerId)
      .eq("exception_date", dateString);

    if (exceptions && exceptions.length > 0) {
      // Check if any exception blocks this time
      for (const exception of exceptions as ProviderAvailabilityException[]) {
        if (!exception.is_available) {
          // This is a blocking exception
          if (!exception.start_time || !exception.end_time) {
            // Full day blocking
            return {
              isValid: false,
              error: "Provider is not available on this date",
            };
          } else {
            // Time-specific blocking
            if (
              proposedTime >= exception.start_time &&
              proposedTime < exception.end_time
            ) {
              return {
                isValid: false,
                error: "Provider is not available during this time",
              };
            }
          }
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Availability validation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
