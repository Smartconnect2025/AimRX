"use client";

import React from "react";
import { cn } from "@/utils/tailwind-utils";
import { ProviderDashboardProps } from "./types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
          <Link href="/prescriptions/new/step1">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              New Prescription
            </Button>
          </Link>
        </div>
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
