import { createClient } from "@core/supabase/client";
import {
  addDays,
  set,
  isBefore,
  isAfter,
  isEqual,
  format as formatDate,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Appointment } from "@/features/bookings/types";
import { checkAppointmentConflict } from "@/features/provider-search/utils/appointmentConflicts";
import type {
  ProviderAvailability,
  ProviderAvailabilityException,
} from "@/core/database/schema";

// Type alias for the exception with the date field as string (from DB query)
type ProviderException = ProviderAvailabilityException & {
  exception_date: string; // Date string in YYYY-MM-DD format from the database
};

export async function getNextAvailableSlots(
  providerId: string,
  slotDurationMinutes = 30,
  maxSlots = 20, // Increased default to show more slots
  _bufferMinutes = 0, // No buffer time - only check direct conflicts (unused parameter for backward compatibility)
): Promise<string[]> {
  const supabase = createClient();
  const today = new Date();
  const searchEndDate = addDays(today, 21); // Look ahead 3 weeks to find more slots

  try {
    // 1. Get provider's base availability
    const { data: baseAvailability, error: availabilityError } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId);

    if (availabilityError) {
      console.warn("Error fetching provider availability:", availabilityError);
      return []; // Return empty array instead of fallback slots
    }

    // If no availability data, provider is not available
    if (!baseAvailability || baseAvailability.length === 0) {
      return []; // Return empty array instead of fallback slots
    }

    // Get provider timezone from the first availability record
    const providerTimezone = baseAvailability[0]?.provider_timezone || "UTC";

    // 2. Get exceptions for the date range
    const { data: exceptions } = await supabase
      .from("provider_availability_exceptions")
      .select("*")
      .eq("provider_id", providerId)
      .gte("exception_date", formatDate(today, "yyyy-MM-dd"))
      .lte("exception_date", formatDate(searchEndDate, "yyyy-MM-dd"));

    // 3. Get booked appointments to exclude from available slots
    let bookedAppointments: Appointment[] = [];
    try {
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, provider_id, patient_id, datetime, duration, type, reason")
        .eq("provider_id", providerId)
        .gte("datetime", today.toISOString())
        .lte("datetime", searchEndDate.toISOString());

      if (appointmentsError) {
        console.warn("Error fetching appointments:", appointmentsError);
      } else {
        bookedAppointments = (appointments as Appointment[]) || [];
      }
    } catch (error) {
      console.warn("Error accessing appointments table:", error);
    }

    // 4. Generate all possible slots
    const slots: Date[] = [];
    let currentDate = new Date(today);

    while (
      isBefore(currentDate, searchEndDate) ||
      isEqual(currentDate, searchEndDate)
    ) {
      // Convert JavaScript day (0=Sunday, 1=Monday, ..., 6=Saturday)
      // to your DB format (0=Monday, 1=Tuesday, ..., 6=Sunday)
      const jsDay = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const dbDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday, ..., 6=Sunday

      const dayAvailabilities = (
        baseAvailability as ProviderAvailability[]
      ).filter((a: ProviderAvailability) => a.day_of_week === dbDay);

      for (const avail of dayAvailabilities) {
        const startTime = avail.start_time;
        const endTime = avail.end_time;

        // Parse time strings (format: HH:MM:SS or HH:MM)
        const [startHour, startMinute] = startTime.split(":").map(Number);
        const [endHour, endMinute] = endTime.split(":").map(Number);

        // Create slots in provider's timezone first
        const slotStart = set(new Date(currentDate), {
          hours: startHour,
          minutes: startMinute,
          seconds: 0,
          milliseconds: 0,
        });

        const slotEndLimit = set(new Date(currentDate), {
          hours: endHour,
          minutes: endMinute,
          seconds: 0,
          milliseconds: 0,
        });

        // Convert provider timezone slots to UTC for comparison
        const providerSlotStart = fromZonedTime(slotStart, providerTimezone);
        const providerSlotEndLimit = fromZonedTime(
          slotEndLimit,
          providerTimezone,
        );

        let currentSlot = providerSlotStart;

        while (isBefore(currentSlot, providerSlotEndLimit)) {
          // Only add future slots (at least 30 minutes from now to allow booking time)
          const thirtyMinutesFromNow = new Date(
            today.getTime() + 30 * 60 * 1000,
          );
          if (isAfter(currentSlot, thirtyMinutesFromNow)) {
            slots.push(new Date(currentSlot));
          }

          // Move to next 30-minute slot (regardless of appointment duration)
          currentSlot = new Date(currentSlot.getTime() + 30 * 60000);

          // Check if we can fit a full appointment in the remaining time
          const slotEnd = new Date(
            currentSlot.getTime() + slotDurationMinutes * 60000,
          );
          if (isAfter(slotEnd, providerSlotEndLimit)) break;
        }
      }
      currentDate = addDays(currentDate, 1);
    }

    // 5. Filter out slots based on exceptions and booked appointments
    const availableSlots = slots.filter((slot) => {
      // Convert slot back to provider timezone for exception checking
      const slotInProviderTz = toZonedTime(slot, providerTimezone);
      const slotDateStr = formatDate(slotInProviderTz, "yyyy-MM-dd");

      const inException = ((exceptions as ProviderException[]) || []).some(
        (ex: ProviderException) => {
          if (ex.exception_date === slotDateStr) {
            if (!ex.is_available) {
              // If there are specific times for the exception, check them
              if (ex.start_time && ex.end_time) {
                const [exStartHour, exStartMinute] = ex.start_time
                  .split(":")
                  .map(Number);
                const [exEndHour, exEndMinute] = ex.end_time
                  .split(":")
                  .map(Number);

                const exceptionStart = set(new Date(slotInProviderTz), {
                  hours: exStartHour,
                  minutes: exStartMinute,
                  seconds: 0,
                  milliseconds: 0,
                });
                const exceptionEnd = set(new Date(slotInProviderTz), {
                  hours: exEndHour,
                  minutes: exEndMinute,
                  seconds: 0,
                  milliseconds: 0,
                });

                // Convert exception times to UTC for comparison
                const exceptionStartUtc = fromZonedTime(
                  exceptionStart,
                  providerTimezone,
                );
                const exceptionEndUtc = fromZonedTime(
                  exceptionEnd,
                  providerTimezone,
                );

                // Check if slot overlaps with exception time
                const slotEnd = new Date(
                  slot.getTime() + slotDurationMinutes * 60000,
                );
                return (
                  (isAfter(slot, exceptionStartUtc) &&
                    isBefore(slot, exceptionEndUtc)) ||
                  (isAfter(slotEnd, exceptionStartUtc) &&
                    isBefore(slotEnd, exceptionEndUtc)) ||
                  (isBefore(slot, exceptionStartUtc) &&
                    isAfter(slotEnd, exceptionEndUtc))
                );
              }
              // Otherwise, the whole day is unavailable
              return true;
            }
          }
          return false;
        },
      );

      if (inException) return false;

      // Check booked appointments for direct conflicts only (no buffer time)
      const conflict = checkAppointmentConflict(
        slot,
        slotDurationMinutes,
        bookedAppointments,
        0, // No buffer time - only check direct overlaps
      );

      const isBooked = conflict.hasConflict;

      return !isBooked;
    });

    // 6. Sort slots by date/time and return as UTC ISO strings
    const sortedSlots = availableSlots.sort(
      (a, b) => a.getTime() - b.getTime(),
    );

    // Return slots as UTC ISO strings - the frontend will handle timezone display automatically
    return sortedSlots.slice(0, maxSlots).map((slot) => slot.toISOString());
  } catch (error) {
    console.warn("Error in getNextAvailableSlots:", error);
    return []; // Return empty array instead of fallback slots
  }
}
