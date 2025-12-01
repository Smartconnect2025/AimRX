import { addDays, format, isWeekend, setHours, setMinutes } from "date-fns";
import { TimeSlot } from "../types";

export function generateTimeSlots(startDate: Date = new Date()): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let currentDate = startDate;
  let attempts = 0;
  const maxAttempts = 14; // Try for 2 weeks

  while (slots.length < 3 && attempts < maxAttempts) {
    // Skip weekends
    if (isWeekend(currentDate)) {
      currentDate = addDays(currentDate, 1);
      attempts++;
      continue;
    }

    // Generate slots for business hours (9 AM to 5 PM)
    for (let hour = 9; hour < 17; hour++) {
      const slotDate = setHours(currentDate, hour);
      const slotTime = setMinutes(slotDate, 0);

      // Only add if we haven't reached 3 slots yet
      if (slots.length < 3) {
        slots.push({
          id: `slot-${slots.length + 1}`,
          date: slotTime,
          time: format(slotTime, "h:mm a"),
          isAvailable: true,
        });
      }
    }

    currentDate = addDays(currentDate, 1);
    attempts++;
  }

  return slots;
}
