"use client";

import { Provider } from "../types";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NewAppointmentModal from "@/features/bookings/components/NewAppointmentModal";
import AppointmentConfirmationModal from "@/features/bookings/components/AppointmentConfirmationModal";
import { useUser } from "@core/auth";
import { useAppointments } from "@/features/bookings/hooks/useAppointments";
import {
  AppointmentWithProvider,
  CreateAppointmentData,
} from "@/features/bookings/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { slotValidationService } from "../services/slotValidationService";
import { Loader2 } from "lucide-react";

interface ProviderCardProps {
  provider: Provider;
  selectedSlot: string | null;
  onSlotSelect: (slot: string | null) => void;
  onBookingComplete?: () => void;
}

export function ProviderCard({
  provider,
  selectedSlot,
  onSlotSelect,
  onBookingComplete,
}: ProviderCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const { patientId, createAppointment } = useAppointments(
    user?.id || null,
    user?.email,
  );

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [intakeDialogOpen, setIntakeDialogOpen] = useState(false);
  const [confirmationDetails, setConfirmationDetails] =
    useState<AppointmentWithProvider | null>(null);
  const [isValidatingSlot, setIsValidatingSlot] = useState(false);

  const handleSlotSelect = (e: React.MouseEvent, slot: string) => {
    e.stopPropagation(); // Prevent the card's click handler from firing
    if (selectedSlot === slot) {
      // If clicking the same slot, deselect it
      onSlotSelect(null);
    } else {
      // If clicking a different slot, select it
      onSlotSelect(slot);
    }
  };

  const handleCardClick = () => {
    if (selectedSlot) {
      onSlotSelect(null);
    }
  };

  const handleBook = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to book an appointment");
      return;
    }

    // Check if user has completed intake
    if (!patientId) {
      setIntakeDialogOpen(true);
      return;
    }

    // If a slot is selected, validate it before proceeding
    if (selectedSlot) {
      setIsValidatingSlot(true);
      try {
        const validation = await slotValidationService.validateSlotAvailability(
          provider.id,
          selectedSlot,
          30, // Default duration
        );

        if (!validation.isAvailable) {
          toast.error(
            validation.error ||
              "This slot is already booked. Please select another slot",
          );
          // Clear the selected slot since it's no longer available
          onSlotSelect(null);
          setIsValidatingSlot(false);
          return;
        }
      } catch (error) {
        console.error("Error validating slot:", error);
        toast.error("Unable to verify slot availability. Please try again.");
        setIsValidatingSlot(false);
        return;
      }
      setIsValidatingSlot(false);
    }

    // Open appointment modal - it will handle slot selection if none is pre-selected
    setAppointmentModalOpen(true);
  };

  const handleCreateAppointment = async (
    appointmentDetails: CreateAppointmentData,
  ) => {
    const created = await createAppointment(appointmentDetails);
    if (created) {
      // Check if this appointment is for a pending sync order
      const pendingOrderId = sessionStorage.getItem("pendingOrderId");
      const pendingOrderType = sessionStorage.getItem("pendingOrderType");

      if (pendingOrderId && pendingOrderType) {
        try {
          // Link the appointment to the sync order
          const response = await fetch(
            "/api/basic-emr/orders/link-appointment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                appointmentId: created.id,
                orderId: pendingOrderId,
                orderType: pendingOrderType,
              }),
            },
          );

          const result = await response.json();

          if (result.success) {
            toast.success("Appointment scheduled and linked to your order!");
            // Clear pending order from session storage
            sessionStorage.removeItem("pendingOrderId");
            sessionStorage.removeItem("pendingOrderType");
            // Clear cart since order is now complete
            localStorage.removeItem("pendingOrderId");
            localStorage.removeItem("pendingOrderType");
          } else {
            toast.error(
              "Appointment created but failed to link to order. Please contact support.",
            );
          }
        } catch (error) {
          console.error("Error linking appointment to order:", error);
          toast.error(
            "Appointment created but failed to link to order. Please contact support.",
          );
        }
      }

      setConfirmationDetails(created as AppointmentWithProvider);
      setConfirmationModalOpen(true);
      // Clear the selected slot after successful booking
      onSlotSelect(null);
    }
  };

  const handleGoToIntake = () => {
    setIntakeDialogOpen(false);
    router.push("/intake/patient-information");
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Preserve current search context by including search params
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);

      let profileUrl = `/provider-search/${provider.id}`;
      if (searchParams.toString()) {
        profileUrl += `?${searchParams.toString()}`;
      }

      router.push(profileUrl);
    } else {
      // Fallback for SSR
      router.push(`/provider-search/${provider.id}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm" onClick={handleCardClick}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12 rounded-full overflow-hidden">
              <img
                src={
                  provider.avatarUrl
                    ? provider.avatarUrl
                    : "/images/avatars/DrDavid_avatar.jpg"
                }
                alt={`${provider.first_name} ${provider.last_name}`}
                className="h-full w-full object-cover"
              />
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {provider.first_name} {provider.last_name}
              </h3>
              <p className="text-muted-foreground">{provider.specialty}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* View Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewProfile}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="View Profile"
            >
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Licensed States */}
        <div className="flex gap-2">
          {provider.licensedStates.map((state) => (
            <div
              key={state}
              className="px-3 py-1 rounded-full border bg-primary/10 text-primary text-sm"
            >
              {state}
            </div>
          ))}
        </div>

        {/* Insurance Plans */}
        <div className="space-y-2">
          <h4 className="text-base font-medium">Insurance Plans</h4>
          <div className="flex flex-wrap gap-2">
            {provider.insurancePlans.map((plan) => (
              <div
                key={plan}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
              >
                {plan}
              </div>
            ))}
          </div>
        </div>

        {/* Next Available */}
        {provider.availability.status === "scheduled" &&
          provider.availability.nextSlots && (
            <div className="space-y-2">
              <h4 className="text-base font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                Next Available
              </h4>
              <div className="space-y-2">
                {provider.availability.nextSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlot === slot ? "default" : "outline"}
                    className={`w-full justify-start text-left font-normal ${
                      selectedSlot === slot
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                        : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                    onClick={(e) => handleSlotSelect(e, slot)}
                  >
                    {format(new Date(slot), "MMM d, h:mm a")}
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* Book Button */}
        <Button
          variant="default"
          className="w-full"
          onClick={handleBook}
          disabled={isValidatingSlot}
        >
          {isValidatingSlot ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating Slot...
            </>
          ) : selectedSlot ? (
            "Book Selected Time"
          ) : (
            "Book Appointment"
          )}
        </Button>
      </div>

      {/* Appointment Modal */}
      <NewAppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        onCreate={handleCreateAppointment}
        provider={provider}
        patientId={patientId || ""}
        preselectedSlot={selectedSlot}
      />

      {/* Confirmation Modal */}
      <AppointmentConfirmationModal
        open={confirmationModalOpen}
        onOpenChange={(open) => {
          setConfirmationModalOpen(open);
          if (!open && onBookingComplete) {
            onBookingComplete();
          }
        }}
        // onReschedule={() => setConfirmationModalOpen(false)}
        // onCancel={() => setConfirmationModalOpen(false)}
        details={confirmationDetails}
      />

      {/* Intake Required Dialog */}
      <AlertDialog open={intakeDialogOpen} onOpenChange={setIntakeDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Your Intake First</AlertDialogTitle>
            <AlertDialogDescription>
              Please complete your intake process before booking an appointment.
              This helps us provide you with the best possible care and ensures
              we have all the necessary information for your visit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToIntake}>
              Take Me to Intake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
