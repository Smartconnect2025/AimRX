"use client";

import { ProviderProfileSection } from "./ProviderProfileSection";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { ProviderProfile } from "../types/provider-profile";
import { format } from "date-fns";

interface ProviderAvailabilityProps {
  provider: ProviderProfile;
}

export function ProviderAvailability({ provider }: ProviderAvailabilityProps) {
  const workingHours = provider.availability.workingHours;
  const nextSlots = provider.availability.nextSlots || [];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };
    return dayNames[day] || day;
  };

  return (
    <ProviderProfileSection title="Availability">
      <div className="space-y-4">
        {/* Next Available Slots */}
        {nextSlots.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Next Available
            </h4>
            <div className="space-y-2">
              {nextSlots.slice(0, 3).map((slot) => (
                <div
                  key={slot}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <span className="text-sm font-medium text-green-800">
                    {format(new Date(slot), "MMM d, h:mm a")}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    Available
                  </Badge>
                </div>
              ))}
              {nextSlots.length > 3 && (
                <p className="text-sm text-gray-500">
                  +{nextSlots.length - 3} more available times
                </p>
              )}
            </div>
          </div>
        )}

        {/* Working Hours */}
        {workingHours && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Working Hours
            </h4>
            <div className="space-y-2">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div
                  key={day}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {getDayName(day)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {hours.isAvailable
                      ? `${formatTime(hours.start)} - ${formatTime(hours.end)}`
                      : "Closed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No availability message */}
        {nextSlots.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              No upcoming availability. Please check back later or contact the
              provider directly.
            </p>
          </div>
        )}
      </div>
    </ProviderProfileSection>
  );
}
