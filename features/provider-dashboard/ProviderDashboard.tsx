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
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Provider Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your appointments, orders, and patient care
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/prescriptions/new/step1"
          className="group bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-[4px] p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl border border-gray-200"
        >
          <FileText className="h-12 w-12 mb-3 text-white" />
          <h3 className="text-xl font-bold text-white">Write New Prescription</h3>
          <p className="text-sm mt-2 text-white opacity-90">Create and submit e-prescriptions</p>
        </Link>
        <Link
          href="/basic-emr"
          className="group bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-[4px] p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl border border-gray-200"
        >
          <UserPlus className="h-12 w-12 mb-3 text-white" />
          <h3 className="text-xl font-bold text-white">Register New Patient</h3>
          <p className="text-sm mt-2 text-white opacity-90">Add patients to your EMR</p>
        </Link>
      </div>

      <div className="mb-8">
        <UpcomingMeetings
          appointments={appointments}
          loading={loading}
          error={error}
          cancelAppointment={cancelAppointment}
        />
      </div>

      {/* Past Appointments */}
      <div className="mb-8">
        <PastAppointments
          pastAppointments={pastAppointments}
          pastLoading={pastLoading}
          pastError={pastError}
        />
      </div>
    </div>
  );
};
