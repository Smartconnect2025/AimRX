"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@core/auth";
import { generateDisplayNameFromUser } from "@/core/services/chat/utils";
import "@cometchat/chat-uikit-react/css-variables.css";
import { Loader2 } from "lucide-react";

// Dynamically import CometChat component with SSR disabled
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

export default function ProviderVideoCallPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const appointmentId = searchParams.get("appointmentId");
  const displayName = user ? generateDisplayNameFromUser(user) : "";

  // Show loading state
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

  // Check for user authentication
  if (!user) {
    router.push("/auth");
    return null;
  }

  // Check for appointment ID
  if (!appointmentId) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Missing Appointment ID
          </h1>
          <p className="text-slate-600 mb-4">
            Please access this page via an appointment link.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background to-muted/20 py-4 px-4">
      <ProviderVideoCall
        appointmentId={appointmentId}
        currentUserId={user.id}
        currentUserName={displayName}
      />
    </div>
  );
}
