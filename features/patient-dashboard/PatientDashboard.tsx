"use client";
import { SessionsList } from "@/features/telehealth/components/session/SessionsList";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePatientAppointments } from "./hooks/usePatientAppointments";
import { appointmentsToSessions } from "./utils/appointmentToSession";
import { PastAppointments } from "./components/PastAppointments";
import { toast } from "sonner";
import { QuickActions } from "./components/QuickActions";

export function PatientDashboard() {
  // Fetch real appointments from database
  const { appointments, loading, error, cancelAppointment } =
    usePatientAppointments();

  // Convert appointments to sessions - show all upcoming appointments
  const allSessions = appointmentsToSessions(appointments);

  // Show all sessions instead of filtering by status
  const activeSessions = allSessions;

  const handleJoinSession = (sessionId: string) => {
    // Navigate to the appointment page using the new video call URL format
    window.location.href = `/appointment/${sessionId}`;
  };

  const handleCancelSession = async (sessionId: string) => {
    const success = await cancelAppointment(sessionId);
    if (success) {
      toast.success("Appointment cancelled successfully");
    } else {
      toast.error("Failed to cancel appointment");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-16 px-4">
      {/* Quick Actions Section */}
      <QuickActions />
      {/* Your Sessions Container */}
      <section className="mb-10 bg-card rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Sessions</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">
              Error loading appointments: {error}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : (
          <SessionsList
            sessions={activeSessions}
            onJoinSession={handleJoinSession}
            onSessionClick={handleCancelSession}
          />
        )}
      </section>

      {/* Past Appointments Section */}
      <section className="mb-10 bg-card rounded-lg shadow-sm p-6 border border-border">
        <PastAppointments />
      </section>
    </div>
  );
}
