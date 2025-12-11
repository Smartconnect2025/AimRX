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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Platform Owner Dashboard
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/doctors">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex items-center justify-start gap-4 text-left hover:bg-gray-50"
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-base">View Providers</div>
                <div className="text-sm text-gray-600">Manage provider accounts</div>
              </div>
            </Button>
          </Link>

          <Link href="/admin/pharmacy-management">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex items-center justify-start gap-4 text-left hover:bg-gray-50"
            >
              <div className="bg-green-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-base">View Pharmacies</div>
                <div className="text-sm text-gray-600">Manage pharmacy settings</div>
              </div>
            </Button>
          </Link>

          <Link href="/admin/medication-catalog">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex items-center justify-start gap-4 text-left hover:bg-gray-50"
            >
              <div className="bg-purple-100 p-3 rounded-lg">
                <Pill className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-base">View Medications</div>
                <div className="text-sm text-gray-600">Browse medication catalog</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
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
