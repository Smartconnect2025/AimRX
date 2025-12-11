"use client";

import React from "react";
import Link from "next/link";
import { AdminDashboardProps } from "./types";
import { cn } from "@/utils/tailwind-utils";
import { Button } from "@/components/ui/button";
import { Users, Building2, Pill } from "lucide-react";

import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { MetricCard } from "./components/MetricCard";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  className,
}) => {
  const { metrics, isLoading, error } = useAdminDashboard();

  if (error) {
    return (
      <div className={cn("container mx-auto max-w-7xl py-8 px-4", className)}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
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
    <div className={cn("container mx-auto max-w-7xl py-8 px-4", className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Platform Owner Dashboard</h1>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8">
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

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <Link href="/admin/doctors" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-4 justify-start gap-3 hover:bg-gray-50 border-gray-300"
            >
              <Users className="h-5 w-5 text-[#1E3A8A]" />
              <span className="font-medium text-sm">Manage Providers</span>
            </Button>
          </Link>

          <Link href="/admin/pharmacy-management" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-4 justify-start gap-3 hover:bg-gray-50 border-gray-300"
            >
              <Building2 className="h-5 w-5 text-[#1E3A8A]" />
              <span className="font-medium text-sm">Manage Pharmacies</span>
            </Button>
          </Link>

          <Link href="/admin/medication-catalog" className="flex-1">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-4 justify-start gap-3 hover:bg-gray-50 border-gray-300"
            >
              <Pill className="h-5 w-5 text-[#1E3A8A]" />
              <span className="font-medium text-sm">Manage Medications</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
