import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, User, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays, isBefore, isAfter, startOfDay } from "date-fns";
import type { CreateAppointmentData } from "../types";
import { Provider } from "@/features/provider-search/types";
import { settingsService } from "../services/settingsService";
import { cn } from "@/utils/tailwind-utils";
import type { Patient } from "@/core/database/schema";
import { getNextAvailableSlots } from "@/features/provider-search/get-next-available-slots";

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (details: CreateAppointmentData) => void;
  provider?: Provider;
  patientId: string;
  preselectedSlot?: string | null;
  showTimeSelection?: boolean;
  patient?: Pick<Patient, "id" | "first_name" | "last_name"> | null;
  isProviderBooking?: boolean;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  open,
  onOpenChange,
  onCreate,
  provider,
  patientId,
  preselectedSlot,
  showTimeSelection = false,
  patient = null,
  isProviderBooking = false,
}) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [appointmentType, setAppointmentType] =
    useState<string>("consultation");
  const [duration, setDuration] = useState<number>(30);
  const [reason, setReason] = useState("");
  const [viewAllSlots, setViewAllSlots] = useState(showTimeSelection);
  const [defaultDuration, setDefaultDuration] = useState<number>(30);
  const [canChangeDuration, setCanChangeDuration] = useState<boolean>(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Load settings and handle preselected slot
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load duration settings
        const defaultTelehealthDuration =
          await settingsService.getDefaultPatientDuration("telehealth");
        setDefaultDuration(defaultTelehealthDuration);
        setDuration(defaultTelehealthDuration);

        // Check if patient can change duration
        const canChange = provider
          ? await settingsService.doesProviderAllowPatientDurationChange(
              provider.id,
            )
          : await settingsService.canPatientChangeDuration();
        setCanChangeDuration(canChange);
      } catch (error) {
        console.error("Error loading settings:", error);
        // Use defaults on error
        setDefaultDuration(30);
        setDuration(30);
        setCanChangeDuration(false);
      }
    };

    if (open) {
      loadSettings();
    }
  }, [open, provider]);

  // Handle preselected slot from provider search
  useEffect(() => {
    if (preselectedSlot) {
      const slotDate = new Date(preselectedSlot);
      setDate(slotDate);
      setTime(preselectedSlot); // Store the full ISO string, not just the time
      // Trigger slot loading for this date
      setAvailableTimeSlots([]);
    }
  }, [preselectedSlot]);

  // Load available time slots when date or provider changes
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!provider || !date) {
        setAvailableTimeSlots([]);
        return;
      }

      setLoadingTimeSlots(true);
      try {
        // Get more available slots for the provider to ensure we have enough for the selected date
        const slots = await getNextAvailableSlots(provider.id, duration, 50);

        // Filter slots to only show those on the selected date
        const slotsForDate = slots.filter((slot) => {
          const slotDate = new Date(slot);
          return startOfDay(slotDate).getTime() === startOfDay(date).getTime();
        });

        // Sort slots by time for better display
        const sortedSlots = slotsForDate.sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime();
        });

        setAvailableTimeSlots(sortedSlots);
      } catch (error) {
        console.error("Error loading available time slots:", error);
        setAvailableTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };

    loadAvailableSlots();
  }, [date, provider, duration]);

  // Update duration when appointment type changes
  useEffect(() => {
    const updateDurationForType = async () => {
      if (appointmentType === "telehealth" || appointmentType === "in_person") {
        try {
          const newDuration = provider
            ? await settingsService.getProviderDefaultDuration(
                provider.id,
                appointmentType as "telehealth" | "in_person",
              )
            : await settingsService.getDefaultPatientDuration(
                appointmentType as "telehealth" | "in_person",
              );
          setDuration(newDuration);
        } catch (error) {
          console.error("Error updating duration:", error);
          setDuration(appointmentType === "telehealth" ? 30 : 45);
        }
      }
    };

    updateDurationForType();
  }, [appointmentType, provider]);

  const handleCreate = async () => {
    if (!date || !provider) {
      return;
    }

    setIsCreating(true);

    try {
      // Use the time value directly - it's already a UTC ISO string from availableTimeSlots
      // No timezone conversion needed as getNextAvailableSlots() already handled it
      const appointmentDetails: CreateAppointmentData = {
        provider_id: provider.id,
        patient_id: patientId,
        datetime: time, // Use the ISO string directly from the selected slot
        duration: duration,
        type: appointmentType,
        reason: reason || "Regular appointment",
      };

      await onCreate(appointmentDetails);

      // Reset form after successful creation
      setDate(undefined);
      setTime("");
      setAppointmentType("consultation");
      setDuration(defaultDuration);
      setReason("");
      setViewAllSlots(false);
      setAvailableTimeSlots([]);

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Failed to create appointment:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectThisSlot = () => {
    handleCreate();
  };

  const handleViewAllSlots = () => {
    setViewAllSlots(true);
  };

  const isFormValid = () => {
    return (
      date &&
      time &&
      provider &&
      patientId &&
      appointmentType &&
      reason.trim() &&
      !loadingTimeSlots &&
      !isCreating
    );
  };

  const getModalTitle = () => {
    if (isProviderBooking && patient) {
      // Provider booking for patient
      const patientName = `${patient.first_name} ${patient.last_name}`;
      return `Book with ${patientName}`;
    }

    if (!provider) {
      return isProviderBooking ? "Book Appointment" : "New Appointment";
    }

    // Patient booking with provider
    return `Book with ${provider.first_name} ${provider.last_name}`;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing during creation
        if (!isCreating) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] w-[95vw] bg-white border border-border shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* Details Section - moved below title */}
        {(provider || patient) && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                {isProviderBooking && patient ? (
                  /* Provider booking for patient */
                  <>
                    <div className="font-medium text-foreground">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="text-sm text-primary">Patient</div>
                  </>
                ) : provider ? (
                  /* Patient booking with provider */
                  <>
                    <div className="font-medium text-foreground">
                      {provider.first_name} {provider.last_name}
                    </div>
                    <div className="text-sm text-primary">
                      {provider.specialty}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Type of Appointment</label>
            <Select
              value={appointmentType}
              onValueChange={setAppointmentType}
              disabled={isCreating}
            >
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                <SelectItem value="consultation">
                  Initial Consultation
                </SelectItem>
                <SelectItem value="followup">Follow-up Appointment</SelectItem>
                <SelectItem value="therapy">Therapy Session</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="emergency">
                  Emergency Consultation
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration field - only show if patient can change duration */}
          {canChangeDuration && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(Number(value))}
                disabled={isCreating}
              >
                <SelectTrigger className="rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show default duration if patient cannot change it */}
          {!canChangeDuration && (
            <div className="bg-gray-50 border border-border rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700">
                Duration: {duration} minutes
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Duration is set by your provider
              </div>
            </div>
          )}

          {/* Date and Time Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Appointment Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border border-border",
                      !date && "text-muted-foreground",
                    )}
                    disabled={isCreating}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border border-border"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      isBefore(date, startOfDay(new Date())) ||
                      isAfter(date, addDays(new Date(), 30))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Appointment Time</label>
              <Select
                value={time}
                onValueChange={setTime}
                disabled={!date || loadingTimeSlots || isCreating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingTimeSlots
                        ? "Loading times..."
                        : !date
                          ? "Select date first"
                          : "Select time"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {loadingTimeSlots ? (
                    <SelectItem value="loading" disabled>
                      Loading available times...
                    </SelectItem>
                  ) : availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((slot) => {
                      const slotDate = new Date(slot);
                      const timeLabel = format(slotDate, "h:mm a");
                      return (
                        <SelectItem key={slot} value={slot}>
                          {timeLabel}
                        </SelectItem>
                      );
                    })
                  ) : date ? (
                    <SelectItem value="no-slots" disabled>
                      No available times for this date
                    </SelectItem>
                  ) : (
                    <SelectItem value="select-date" disabled>
                      Please select a date first
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for Appointment
            </label>
            <Textarea
              placeholder="Please describe the reason for your appointment"
              className="resize-none rounded-md"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={isCreating}
            />
          </div>
        </div>
        <DialogFooter>
          {preselectedSlot && !viewAllSlots ? (
            // Modal flow for pre-selected slot
            <div className="flex w-full flex-col gap-3">
              <Button
                variant="default"
                onClick={handleSelectThisSlot}
                disabled={!isFormValid()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book This Slot"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleViewAllSlots}
                className="border border-border"
                disabled={isCreating}
              >
                View All Available Times
              </Button>
            </div>
          ) : (
            // Standard booking flow
            <div className="flex w-full justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border border-border"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleCreate}
                disabled={!isFormValid()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
