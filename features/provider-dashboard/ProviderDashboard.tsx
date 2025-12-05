"use client";

import React from "react";
import { cn } from "@/utils/tailwind-utils";
import { ProviderDashboardProps } from "./types";
import Link from "next/link";
import { FileText, UserPlus } from "lucide-react";

import { UpcomingMeetings } from "./components/UpcomingMeetings";
import { PastAppointments } from "./components/PastAppointments";
import { useProviderAppointments } from "./hooks/useProviderAppointments";

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  className,
}) => {
  const {
    appointments,
    pastAppointments,
    loading,
    pastLoading,
    error,
    pastError,
    cancelAppointment,
  } = useProviderAppointments();

  return (
    <div
      className={cn(
        "container mx-auto max-w-5xl py-8 sm:py-16 px-4",
        className,
      )}
    >
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#1E3A8A] to-[#00AEEF] bg-clip-text text-transparent">
          Welcome to Your AIM Portal
        </h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          Streamline your regenerative medicine practice with AI-powered prescription management and patient records
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
        <Link
          href="/prescriptions/new/step1"
          className="group relative bg-gradient-to-br from-[#1E3A8A] to-[#2D4A9E] hover:from-[#F97316] hover:to-[#FB923C] text-white rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-2 hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-white/10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="bg-white/10 rounded-full p-4 mb-4 group-hover:bg-white/20 transition-all duration-300">
              <FileText className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Write New Prescription</h3>
            <p className="text-sm text-white/90">Submit peptides, PRP/PRF, and regenerative therapies instantly</p>
          </div>
        </Link>
        <Link
          href="/basic-emr"
          className="group relative bg-gradient-to-br from-[#00AEEF] to-[#0891B2] hover:from-[#10B981] hover:to-[#059669] text-white rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-2 hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-white/10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="bg-white/10 rounded-full p-4 mb-4 group-hover:bg-white/20 transition-all duration-300">
              <UserPlus className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Register New Patient</h3>
            <p className="text-sm text-white/90">Add patients and manage electronic medical records seamlessly</p>
          </div>
        </Link>
      </div>

      {/* Appointments sections hidden per user request */}
      {/* <div className="mb-8">
        <UpcomingMeetings
          appointments={appointments}
          loading={loading}
          error={error}
          cancelAppointment={cancelAppointment}
        />
      </div> */}

      {/* Past Appointments */}
      {/* <div className="mb-8">
        <PastAppointments
          pastAppointments={pastAppointments}
          pastLoading={pastLoading}
          pastError={pastError}
        />
      </div> */}
    </div>
  );
};
