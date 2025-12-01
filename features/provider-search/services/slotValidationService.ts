import { createClient } from "@core/supabase/client";
import { Appointment } from "@/features/bookings/types";

/**
 * Service for validating slot availability before booking
 */
export class SlotValidationService {
  private supabase = createClient();

  /**
   * Validates if a specific slot is still available for booking
   * This is a lightweight check that only verifies the slot hasn't been booked
   * since it was originally generated. The slot generation logic already handles
   * all the complex conflict detection and availability checking.
   * @param providerId - ID of the provider
   * @param slotDateTime - The slot datetime to validate
   * @param duration - Duration of the appointment in minutes
   * @returns Validation result with availability status
   */
  async validateSlotAvailability(
    providerId: string,
    slotDateTime: string,
    duration: number = 30,
  ): Promise<{
    isAvailable: boolean;
    error?: string;
    conflictingAppointment?: Appointment;
  }> {
    try {
      const proposedStart = new Date(slotDateTime);
      const proposedEnd = new Date(proposedStart.getTime() + duration * 60000);

      // Validate that the slot is in the future
      if (proposedStart <= new Date()) {
        return {
          isAvailable: false,
          error: "Cannot book appointments in the past",
        };
      }

      // Check for any appointments that directly overlap with this slot
      // We only check for direct overlaps since the slot was already validated
      // for conflicts and availability when it was generated
      const { data: appointments, error: appointmentsError } =
        await this.supabase
          .from("appointments")
          .select("*")
          .eq("provider_id", providerId)
          .gte("datetime", proposedStart.toISOString())
          .lt("datetime", proposedEnd.toISOString());

      if (appointmentsError) {
        return {
          isAvailable: false,
          error: `Error checking slot availability: ${appointmentsError.message}`,
        };
      }

      // If there are any appointments in this exact time slot, it's not available
      if (appointments && appointments.length > 0) {
        return {
          isAvailable: false,
          error: "This slot is already booked. Please select another slot",
          conflictingAppointment: appointments[0] as Appointment,
        };
      }

      return { isAvailable: true };
    } catch (error) {
      console.error("Error validating slot availability:", error);
      return {
        isAvailable: false,
        error: `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}

// Export singleton instance
export const slotValidationService = new SlotValidationService();
