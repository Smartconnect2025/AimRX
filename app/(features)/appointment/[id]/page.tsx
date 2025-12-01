"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useUser } from "@core/auth";
import { Loader2 } from "lucide-react";
import "@cometchat/chat-uikit-react/css-variables.css";
import { generateDisplayNameFromUser } from "@/core/services/chat/utils";

// Dynamically import telehealth video call components with SSR disabled
const ProviderVideoCall = dynamic(
  () => import("@/features/telehealth").then((mod) => mod.ProviderVideoCall),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-screen w-full bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-teal-500" />
          <p className="text-slate-600">Loading video call...</p>
        </div>
      </div>
    ),
  },
);

const PatientVideoCall = dynamic(
  () => import("@/features/telehealth").then((mod) => mod.PatientVideoCall),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-screen w-full bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-teal-500" />
          <p className="text-slate-600">Loading video call...</p>
        </div>
      </div>
    ),
  },
);

export default function AppointmentPage() {
  const params = useParams();
  const appointmentId = params.id as string;
  const { user, userRole, isLoading } = useUser();
  const displayName = user ? generateDisplayNameFromUser(user) : "";

  // Show loading while determining user role
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-teal-500" />
          <p className="text-slate-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  // Show error if no appointment ID
  if (!appointmentId) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Invalid Appointment
          </h1>
          <p className="text-slate-600">No appointment ID provided.</p>
        </div>
      </div>
    );
  }

  // Render appropriate video call component based on user role
  return (
    <div className="bg-gradient-to-b from-background to-muted/20 py-16">
      {userRole === "provider" ? (
        <ProviderVideoCall
          appointmentId={appointmentId}
          currentUserId={user.id}
          currentUserName={displayName}
        />
      ) : (
        <PatientVideoCall
          appointmentId={appointmentId}
          currentUserId={user.id}
          currentUserName={displayName}
        />
      )}
    </div>
  );
}
