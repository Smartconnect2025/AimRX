import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Filter, Loader2, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AppointmentAvailabilityResponse,
  AppointmentSlot,
} from "../services/junctionLabData";
import { LabAppointment, LabPanel } from "../types/lab";
import { Calendar } from "./calendar";
import { LocationDetailsDialog } from "./LocationDetailsDialog";

// Extended appointment slot interface for UI
interface ExtendedAppointmentSlot extends AppointmentSlot {
  location: string;
  address: string;
  date: string;
  price: number;
  num_appointments_available: number;
  is_priority: boolean;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel: LabPanel | null;
  onAppointmentScheduled?: (appointmentDetails: LabAppointment) => void;
}

export const ScheduleDialog = ({
  open,
  onOpenChange,
  panel,
  onAppointmentScheduled,
}: ScheduleDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] =
    useState<ExtendedAppointmentSlot>();
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [locationDetailsOpen, setLocationDetailsOpen] = useState(false);
  const [selectedLocationForDetails, setSelectedLocationForDetails] =
    useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Hardcoded address for sandbox testing (only one that works)
  const addressForm = useMemo(
    () => ({
      first_line: "123 West Lincoln Street",
      city: "Phoenix",
      state: "AZ",
      zip_code: "85004",
    }),
    [],
  );

  // Appointment availability state
  const [availabilityData, setAvailabilityData] =
    useState<AppointmentAvailabilityResponse | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  // Booking state
  const [isBooking, setIsBooking] = useState(false);

  const locations = useMemo(() => {
    if (!availabilityData) return [];

    // Extract unique locations from availability data
    const locationSet = new Set<string>();
    availabilityData.slots.forEach((daySlots) => {
      daySlots.slots.forEach((_slot) => {
        // For now, we'll use a placeholder location name since the API doesn't provide it
        locationSet.add("Lab Center");
      });
    });

    return Array.from(locationSet);
  }, [availabilityData]);

  // Get available dates from the API response
  const availableDates = useMemo(() => {
    if (!availabilityData) return [];
    return availabilityData.slots.map((daySlots) => daySlots.date);
  }, [availabilityData]);

  // Fetch appointment availability automatically when dialog opens
  const fetchAvailability = useCallback(async () => {
    setIsLoadingAvailability(true);
    setAvailabilityError(null);

    try {
      const response = await fetch("/api/labs/junction/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressForm),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`);
      }

      const data: AppointmentAvailabilityResponse = await response.json();
      setAvailabilityData(data);
    } catch (error) {
      console.error("Error fetching appointment availability:", error);
      setAvailabilityError(
        error instanceof Error ? error.message : "Failed to load availability",
      );
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [addressForm]);

  // Convert availability data to extended slots for filtering
  const allTimeSlots = useMemo((): ExtendedAppointmentSlot[] => {
    if (!availabilityData) return [];

    const slots: ExtendedAppointmentSlot[] = [];
    availabilityData.slots.forEach((daySlots) => {
      daySlots.slots.forEach((slot) => {
        // const startDate = new Date(slot.start);
        slots.push({
          ...slot,
          location: "Lab Center", // Placeholder since API doesn't provide location names
          address: `${addressForm.first_line}, ${addressForm.city}, ${addressForm.state}`,
          date: daySlots.date,
          price: 4500, // Default price in cents
          num_appointments_available: 1,
          is_priority: false,
        });
      });
    });

    return slots;
  }, [availabilityData, addressForm]);

  // Filter time slots based on selected filters and date
  const filteredTimeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const selectedDateStr = selectedDate.toISOString().split("T")[0];

    return allTimeSlots.filter((slot) => {
      const slotDate = slot.date;
      const dateMatch = slotDate === selectedDateStr;

      const locationMatch =
        locationFilter === "all" || slot.location === locationFilter;

      const startTime = new Date(slot.start);
      const hour = startTime.getHours();
      const timeMatch =
        timeFilter === "all" ||
        (timeFilter === "morning" && hour < 12) ||
        (timeFilter === "afternoon" && hour >= 12);

      return dateMatch && locationMatch && timeMatch;
    });
  }, [allTimeSlots, selectedDate, locationFilter, timeFilter]);

  const handleSchedule = () => {
    if (!selectedDate || !selectedTimeSlot || !panel) {
      toast("Missing Information", {
        description: "Please select a date and time slot.",
      });
      return;
    }

    // Show confirmation dialog
    setConfirmDialogOpen(true);
  };

  const handleConfirmSchedule = async () => {
    if (!selectedDate || !selectedTimeSlot || !panel) return;

    setIsBooking(true);

    try {
      // Book the appointment with the Junction API
      const response = await fetch("/api/labs/junction/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: panel.id, // Using panel.id as the order ID
          booking_key: selectedTimeSlot.booking_key,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success! Show success toast
        toast.success("Appointment Booked Successfully", {
          description: `Your lab appointment has been scheduled for ${formatTimeFromISO(
            selectedTimeSlot.start,
          )} on ${selectedDate.toLocaleDateString()}.`,
        });

        // Use the actual start time from the API response
        const appointmentTime = new Date(selectedTimeSlot.start);

        const appointmentDetails: LabAppointment = {
          id: result.appointment_id || `apt_${Date.now()}`,
          panelId: panel.id,
          panelName: panel.name,
          scheduledDate: appointmentTime,
          status: "scheduled",
          location: selectedTimeSlot.location,
          address: selectedTimeSlot.address,
        };

        if (onAppointmentScheduled) {
          onAppointmentScheduled(appointmentDetails);
        }

        onOpenChange(false);
        setConfirmDialogOpen(false);
        handleReset();
      } else {
        // Error response from API
        toast.error("Booking Failed", {
          description:
            result.error ||
            result.message ||
            "Failed to book your appointment. Please try again.",
        });
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Booking Failed", {
        description:
          "An unexpected error occurred while booking your appointment. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleReset = () => {
    setSelectedDate(undefined);
    setSelectedTimeSlot(undefined);
    setLocationFilter("all");
    setTimeFilter("all");
    setAvailabilityData(null);
  };

  // Automatically fetch availability when dialog opens
  useEffect(() => {
    if (open && !availabilityData && !isLoadingAvailability) {
      fetchAvailability();
    }
  }, [availabilityData, fetchAvailability, isLoadingAvailability, open]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  const formatTimeFromISO = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleLocationDetails = (locationName: string) => {
    setSelectedLocationForDetails(locationName);
    setLocationDetailsOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="lg:min-w-4xl h-[85vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Lab Visit</DialogTitle>
            <DialogDescription>
              Book your appointment for {panel?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto">
            {isLoadingAvailability ? (
              <div className="space-y-4 py-8">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading available appointments...</span>
                  </div>
                </div>
              </div>
            ) : availabilityError ? (
              <div className="space-y-4">
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {availabilityError}
                </div>
                <Button onClick={fetchAvailability} variant="default">
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Date Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        // Disable past dates
                        if (date < today) return true;

                        // If we don't have availability data yet, allow selection
                        if (!availabilityData) return false;

                        // Only allow dates that have available appointments
                        const dateStr = date.toISOString().split("T")[0];
                        return !availableDates.includes(dateStr ?? "");
                      }}
                      className="rounded-md border w-full pointer-events-auto"
                      classNames={{
                        table: "w-full",
                        months: "flex flex-col space-y-4 w-full",
                        month: "space-y-4 w-full",
                        head_row: "flex w-full",
                        head_cell:
                          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                        row: "flex w-full mt-2",
                        cell: "flex-1 h-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      }}
                      initialFocus
                    />
                  </div>
                </div>

                {/* Right Column - Time Slots and Filters */}
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <Label>Filter Options</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Location
                        </Label>
                        <Select
                          value={locationFilter}
                          onValueChange={setLocationFilter}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Time
                        </Label>
                        <Select
                          value={timeFilter}
                          onValueChange={setTimeFilter}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Times</SelectItem>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div className="space-y-2">
                    <Label>Available Time Slots</Label>
                    {!selectedDate ? (
                      <p className="text-sm text-muted-foreground">
                        Please select a date first
                      </p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {filteredTimeSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No available slots for selected filters
                          </p>
                        ) : (
                          filteredTimeSlots.map((slot) => (
                            <Card
                              key={slot.booking_key}
                              className={`cursor-pointer transition-colors ${
                                selectedTimeSlot?.booking_key ===
                                slot.booking_key
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedTimeSlot(slot)}
                            >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span className="font-medium">
                                        {formatTimeFromISO(slot.start)} -{" "}
                                        {formatTimeFromISO(slot.end)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <Button
                                        variant="link"
                                        className="p-0 h-auto text-sm text-muted-foreground hover:text-primary underline-offset-4"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLocationDetails(slot.location);
                                        }}
                                      >
                                        {slot.location}
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {slot.address}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>
                                        ${(slot.price / 100).toFixed(2)}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {slot.num_appointments_available}{" "}
                                        available
                                      </span>
                                      {slot.is_priority && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Priority
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {selectedTimeSlot?.booking_key ===
                                      slot.booking_key && (
                                      <Badge
                                        variant="default"
                                        className="text-xs"
                                      >
                                        Selected
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleReset}>
              Reset Filters
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={
                  !selectedDate || !selectedTimeSlot || isLoadingAvailability
                }
              >
                Schedule Appointment
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LocationDetailsDialog
        open={locationDetailsOpen}
        onOpenChange={setLocationDetailsOpen}
        locationName={selectedLocationForDetails}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to schedule this appointment?
            </DialogDescription>
          </DialogHeader>

          {selectedDate && selectedTimeSlot && panel && (
            <div className="space-y-3 py-4">
              <div className="text-sm">
                <span className="font-bold">Test:</span> {panel.name}
              </div>
              <div className="text-sm">
                <span className="font-bold">Date:</span>{" "}
                {selectedDate.toLocaleDateString()}
              </div>
              <div className="text-sm">
                <span className="font-bold">Time:</span>{" "}
                {formatTimeFromISO(selectedTimeSlot.start)} -{" "}
                {formatTimeFromISO(selectedTimeSlot.end)}
              </div>
              <div className="text-sm">
                <span className="font-bold">Location:</span>{" "}
                {selectedTimeSlot.location}
              </div>
              <div className="text-sm">
                <span className="font-bold">Address:</span>{" "}
                {selectedTimeSlot.address}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isBooking}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSchedule} disabled={isBooking}>
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Yes, Schedule Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
