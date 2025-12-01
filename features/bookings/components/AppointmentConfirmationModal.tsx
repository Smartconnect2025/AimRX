import React from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AppointmentWithProvider, AppointmentWithPatient } from "../types";
import { format } from "date-fns";
import { getUserTimezone, formatTimezoneShort } from "../utils/timezoneUtils";
import { useRouter } from "next/navigation";

interface AppointmentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: AppointmentWithProvider | AppointmentWithPatient | null;
  isProviderBooking?: boolean;
}

const AppointmentConfirmationModal: React.FC<
  AppointmentConfirmationModalProps
> = ({ open, onOpenChange, details, isProviderBooking = false }) => {
  const router = useRouter();

  if (!details) return null;

  const appointmentDate = new Date(details.datetime);
  const formattedDate = format(appointmentDate, "EEEE, MMMM d, yyyy");
  const formattedTime = format(appointmentDate, "h:mm a");

  // Get user's timezone for display
  const userTimezone = getUserTimezone();
  const timezone = formatTimezoneShort(userTimezone);

  const getDisplayName = () => {
    if (isProviderBooking && "patient" in details) {
      // Provider booking for patient
      const patient = details.patient;
      return `${patient.first_name} ${patient.last_name}`;
    } else if ("provider" in details) {
      // Patient booking with provider
      return (
        `${details.provider?.first_name || ""} ${details.provider?.last_name || ""}`.trim() ||
        "Unknown Provider"
      );
    }
    return "Unknown";
  };

  const handleBackToDashboard = () => {
    onOpenChange(false);
    router.push("/");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] bg-white border border-border">
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold">Appointment Scheduled</h2>
          <p className="text-gray-600">
            Your appointment has been successfully booked.
          </p>
        </div>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">{getDisplayName()}</div>
            <div className="text-gray-600">
              {formattedDate} at {formattedTime} ({timezone})
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleBackToDashboard}
            variant="default"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentConfirmationModal;
