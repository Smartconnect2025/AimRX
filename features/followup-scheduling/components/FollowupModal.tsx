"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimeSlot, FollowupModalProps } from "../types";
import { format } from "date-fns";
import NewAppointmentModal from "@/features/bookings/components/NewAppointmentModal";
import AppointmentConfirmationModal from "@/features/bookings/components/AppointmentConfirmationModal";
import {
  CreateAppointmentData,
  AppointmentWithProvider,
} from "@/features/bookings/types";

export function FollowupModal({
  providerName,
  isOpen,
  onClose,
  onBook: _onBook,
  timeSlots,
}: FollowupModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [bookingDetails, setBookingDetails] =
    useState<AppointmentWithProvider | null>(null);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBook = () => {
    if (selectedSlot) {
      setBookingModalOpen(true);
    }
  };

  const handleCreateBooking = (details: CreateAppointmentData) => {
    // Transform CreateAppointmentData to AppointmentWithProvider for the confirmation modal
    const appointmentWithProvider: AppointmentWithProvider = {
      id: `temp-${Date.now()}`, // Temporary ID
      provider_id: details.provider_id,
      patient_id: details.patient_id,
      datetime: details.datetime,
      duration: details.duration,
      type: details.type,
      reason: details.reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider: {
        id: details.provider_id,
        first_name: providerName.split(" ")[0] || "",
        last_name: providerName.split(" ").slice(1).join(" ") || "",
        specialty: "",
        avatar_url: "",
      },
    };

    setBookingDetails(appointmentWithProvider);
    setBookingModalOpen(false);
    setConfirmationOpen(true);
    onClose(); // Optionally close the follow-up modal
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] !bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Follow-up Appointment
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-gray-600 mb-6">
              Your provider suggests the following times would be best for your
              follow-up appointment:
            </p>

            <div className="space-y-3 mb-6">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                  className={`w-full justify-start text-left font-normal ${
                    selectedSlot?.id === slot.id
                      ? "bg-[#4BCBC7] hover:bg-[#3BABA7] text-white border-0"
                      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={() => handleSlotSelect(slot)}
                >
                  {format(slot.date, "EEEE, MMMM d")} at {slot.time}
                </Button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                I&apos;ll do it later
              </Button>
              <Button
                className="flex-1 bg-[#4BCBC7] hover:bg-[#3BABA7]"
                disabled={!selectedSlot}
                onClick={handleBook}
              >
                Book
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Appointment Modal */}
      <NewAppointmentModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        onCreate={handleCreateBooking}
        provider={{
          id: "temp-provider-id",
          first_name: providerName.split(" ")[0] || "",
          last_name: providerName.split(" ").slice(1).join(" ") || "",
          specialty: "",
          avatarUrl: "",
          licensedStates: [],
          serviceTypes: [],
          insurancePlans: [],
          availability: { status: "scheduled" },
        }}
        patientId="temp-patient-id"
        preselectedSlot={selectedSlot ? selectedSlot.date.toISOString() : null}
      />
      {/* Confirmation Modal */}
      <AppointmentConfirmationModal
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        details={bookingDetails}
      />
    </>
  );
}
