import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { getNextAvailableSlots } from "@/features/provider-search/get-next-available-slots";
import { formatTimezoneShort, getUserTimezone } from "../utils/timezoneUtils";

interface TimeSlotSelectorProps {
  providerId: string;
  selectedSlot: string | null;
  onSlotSelect: (slot: string | null) => void;
  duration?: number;
  maxDays?: number;
  slotsPerDay?: number;
}

interface SlotsByDate {
  [date: string]: string[];
}

export function TimeSlotSelector({
  providerId,
  selectedSlot,
  onSlotSelect,
  duration = 30,
  maxDays = 7,
  slotsPerDay = 8,
}: TimeSlotSelectorProps) {
  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timezone = formatTimezoneShort(getUserTimezone());

  useEffect(() => {
    const fetchAllSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch more slots to distribute across multiple days
        const allSlots = await getNextAvailableSlots(
          providerId,
          duration,
          maxDays * slotsPerDay,
          15, // buffer minutes
        );

        // Group slots by date
        const grouped: SlotsByDate = {};

        allSlots.forEach((slot) => {
          const slotDate = new Date(slot);
          const dateKey = format(slotDate, "yyyy-MM-dd");

          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }

          // Limit slots per day
          if (grouped[dateKey].length < slotsPerDay) {
            grouped[dateKey].push(slot);
          }
        });

        setSlotsByDate(grouped);
      } catch (err) {
        console.error("Error fetching time slots:", err);
        setError("Failed to load available time slots");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSlots();
  }, [providerId, duration, maxDays, slotsPerDay]);

  const handleSlotClick = (slot: string) => {
    if (selectedSlot === slot) {
      onSlotSelect(null);
    } else {
      onSlotSelect(slot);
    }
  };

  const getDateDisplayName = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">{error}</div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const dateKeys = Object.keys(slotsByDate).sort();

  if (dateKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No available appointments
        </h3>
        <p className="text-gray-600">
          This provider has no available time slots in the next {maxDays} days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Available Times</h3>
        <p className="text-sm text-gray-600">
          All times shown in your local timezone ({timezone})
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {dateKeys.map((dateKey) => {
          const slots = slotsByDate[dateKey];
          if (!slots || slots.length === 0) return null;

          return (
            <div key={dateKey} className="space-y-2">
              <h4 className="font-medium text-gray-900 sticky top-0 bg-white py-2">
                {getDateDisplayName(dateKey)}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlot === slot ? "default" : "outline"}
                    className={`text-sm ${
                      selectedSlot === slot
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => handleSlotClick(slot)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(slot), "h:mm a")}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedSlot && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <div className="text-sm font-medium text-teal-800 mb-1">
            Selected Time
          </div>
          <div className="text-teal-700">
            {format(new Date(selectedSlot), "EEEE, MMM d 'at' h:mm a")} (
            {timezone})
          </div>
        </div>
      )}
    </div>
  );
}
