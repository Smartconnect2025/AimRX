"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import NewAppointmentModal from "./components/NewAppointmentModal";
import AppointmentConfirmationModal from "./components/AppointmentConfirmationModal";
import { useUser } from "@core/auth";
import { useAppointments } from "./hooks/useAppointments";
import { Loader2, Calendar, Clock, User, Video } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getUserTimezone, formatTimezoneShort } from "./utils/timezoneUtils";
import { generateVideoCallUrl } from "./utils/videoCallUtils";
import { CreateAppointmentData, AppointmentWithProvider } from "./types";
import { Provider } from "@/features/provider-search/types";

const UpcomingAppointments: React.FC = () => {
  const { user } = useUser();
  const userId = user?.id || null;
  const userEmail = user?.email || undefined;
  const {
    appointments,
    loading,
    error,
    patientId,
    createAppointment,
    deleteAppointment,
  } = useAppointments(userId, userEmail);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationDetails, setConfirmationDetails] =
    useState<AppointmentWithProvider | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<
    Provider | undefined
  >(undefined);
  const [preselectedSlot, setPreselectedSlot] = useState<string | null>(null);

  // Check for provider and slot from sessionStorage (from provider search)
  React.useEffect(() => {
    const storedProvider = sessionStorage.getItem("selectedProvider");
    const storedSlot = sessionStorage.getItem("selectedSlot");

    if (storedProvider && storedSlot) {
      try {
        const parsedProvider = JSON.parse(storedProvider);
        // Create a Provider object with required fields, using defaults for missing ones
        const provider: Provider = {
          id: parsedProvider.id,
          first_name: parsedProvider.first_name,
          last_name: parsedProvider.last_name,
          specialty: parsedProvider.specialty,
          avatarUrl: parsedProvider.avatarUrl || "",
          licensedStates: parsedProvider.licensedStates || [],
          serviceTypes: parsedProvider.serviceTypes || [],
          insurancePlans: parsedProvider.insurancePlans || [],
          availability: parsedProvider.availability || { status: "scheduled" },
        };
        setSelectedProvider(provider);
        setPreselectedSlot(storedSlot);
        setModalOpen(true); // Auto-open the modal

        // Clear the stored data
        sessionStorage.removeItem("selectedProvider");
        sessionStorage.removeItem("selectedSlot");

        toast.success(
          `Ready to book with ${provider.first_name} ${provider.last_name}`,
        );
      } catch (error) {
        console.error("Error parsing stored provider data:", error);
      }
    }
  }, []);

  // Handle appointment creation from modal
  const handleCreate = async (details: CreateAppointmentData) => {
    if (!userId || !patientId) {
      toast.error("You must be logged in to book an appointment");
      return;
    }

    // Override the patient_id with the correct one from the patients table
    const appointmentWithCorrectPatientId = {
      ...details,
      patient_id: patientId,
    };

    const created = await createAppointment(appointmentWithCorrectPatientId);
    if (created) {
      setConfirmationDetails(created as AppointmentWithProvider);
      setConfirmationOpen(true);
      // Modal will close itself on success
    }
  };

  // Handle delete appointment
  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    const ok = confirm("Are you sure you want to cancel this appointment?");
    if (!ok) return;
    const result = await deleteAppointment(id);
    if (result) {
      toast("Appointment cancelled.");
    } else {
      toast.error("Failed to cancel appointment.");
    }
  };

  // Format appointment datetime for display
  const formatAppointmentDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: format(date, "EEEE, MMMM d, yyyy"),
      time: format(date, "h:mm a"),
      timezone: formatTimezoneShort(getUserTimezone()),
    };
  };

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 w-full">
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-4">
            Please log in to view appointments
          </h2>
          <p className="text-gray-600">
            You need to be logged in to book and manage appointments.
          </p>
        </div>
      </div>
    );
  }

  // Show loading while patient ID is being checked
  if (userId && patientId === null && !error && loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 w-full">
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600">Checking your patient profile...</p>
      </div>
    );
  }

  // Show intake required message if user doesn't have a patient record
  if (userId && patientId === null && !loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 w-full">
        <div className="text-center py-8 max-w-md">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full">
              <User className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-amber-800">
              Complete Your Patient Profile
            </h2>
            <p className="text-amber-700 mb-4">
              Please complete your intake process before being able to schedule
              an appointment. This helps us provide you with the best possible
              care.
            </p>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                window.location.href = "/intake/patient-information";
              }}
            >
              Complete Intake Process
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-16 w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
        <p className="text-gray-600">
          Book and manage your healthcare appointments
        </p>
      </div>

      <Button
        size="lg"
        variant="default"
        className="mb-8"
        onClick={() => setModalOpen(true)}
        disabled={!patientId}
      >
        <Calendar className="mr-2 h-5 w-5" />
        Book New Appointment
      </Button>

      <NewAppointmentModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          // Reset state when modal closes
          if (!open) {
            setSelectedProvider(undefined);
            setPreselectedSlot(null);
          }
        }}
        onCreate={handleCreate}
        provider={selectedProvider}
        patientId={patientId || ""}
        preselectedSlot={preselectedSlot}
      />

      <AppointmentConfirmationModal
        open={confirmationOpen}
        onOpenChange={setConfirmationOpen}
        details={confirmationDetails}
      />

      <div className="w-full max-w-5xl mt-8">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {!loading && appointments.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments scheduled
            </h3>
            <p className="text-gray-600 mb-4">
              Book your first appointment to get started
            </p>
            <Button onClick={() => setModalOpen(true)} variant="default">
              Book Appointment
            </Button>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Upcoming Appointments
            </h2>
            {appointments.map((appointment) => {
              const { time, timezone } = formatAppointmentDateTime(
                appointment.datetime,
              );
              return (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-teal-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {appointment.type === "telehealth"
                              ? "Telehealth"
                              : appointment.type === "in_person"
                                ? "In-person"
                                : appointment.type.charAt(0).toUpperCase() +
                                  appointment.type.slice(1)}
                          </h3>
                          <p className="text-gray-600">
                            Dr.{" "}
                            {appointment.provider?.first_name &&
                            appointment.provider?.last_name
                              ? `${appointment.provider.first_name} ${appointment.provider.last_name}`
                              : "Unknown Provider"}
                          </p>
                        </div>
                      </div>

                      {/* Single-line date/time with timezone */}
                      <div className="flex items-center gap-2 text-gray-600 mt-4">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(
                            new Date(appointment.datetime),
                            "MMM d, yyyy",
                          )}{" "}
                          at {time} ({timezone}) - {appointment.duration} min
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span>{" "}
                          {appointment.reason}
                        </p>
                      </div>

                      {appointment.provider?.specialty && (
                        <div className="mt-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {appointment.provider.specialty}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm text-gray-500">
                        Booked{" "}
                        {appointment.created_at
                          ? format(
                              new Date(appointment.created_at),
                              "MMM d, yyyy",
                            )
                          : "Recently"}
                      </div>
                      <div className="flex flex-col gap-2">
                        {appointment.id && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              window.open(
                                generateVideoCallUrl(appointment.id!),
                                "_blank",
                              )
                            }
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Join Video Call
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(appointment.id)}
                        >
                          Cancel Appointment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingAppointments;
