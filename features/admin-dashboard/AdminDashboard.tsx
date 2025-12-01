"use client";

import React from "react";
import { AdminDashboardProps } from "./types";
import { cn } from "@/utils/tailwind-utils";

import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { MetricCard } from "./components/MetricCard";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  className,
}) => {
  const { metrics, isLoading, error } = useAdminDashboard();

  if (error) {
    return (
      <div className={cn("container mx-auto max-w-5xl py-8 px-4", className)}>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading dashboard data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("container mx-auto max-w-5xl py-8 px-4", className)}>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Patients"
          value={metrics?.totalPatients || 0}
          growth={metrics?.patientsGrowth || 0}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Providers"
          value={metrics?.totalProviders || 0}
          growth={metrics?.providersGrowth || 0}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Appointments"
          value={metrics?.totalAppointments || 0}
          growth={metrics?.appointmentsGrowth || 0}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Orders"
          value={metrics?.totalOrders || 0}
          growth={metrics?.ordersGrowth || 0}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Resources"
          value={metrics?.totalResources || 0}
          growth={metrics?.resourcesGrowth || 0}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
