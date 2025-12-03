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
          Platform Owner Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Overview of platform activity and provider status
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <MetricCard
          title="Total Providers Invited"
          value={metrics?.totalProvidersInvited || 0}
          subtitle={`${metrics?.activeProviders || 0} active, ${metrics?.inactiveProviders || 0} inactive`}
          isLoading={isLoading}
        />
        <MetricCard
          title="Orders (Last 24 Hours)"
          value={metrics?.ordersLast24Hours || 0}
          subtitle="Prescriptions submitted"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
