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
            <div className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 flex items-center gap-4 cursor-pointer">
              <Users className="h-6 w-6 text-gray-700" />
              <div>
                <div className="font-semibold text-base">View Providers</div>
                <div className="text-sm text-gray-600">Manage provider accounts</div>
              </div>
            </div>
          </Link>

          <Link href="/admin/pharmacy-management">
            <div className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 flex items-center gap-4 cursor-pointer">
              <Building2 className="h-6 w-6 text-gray-700" />
              <div>
                <div className="font-semibold text-base">View Pharmacies</div>
                <div className="text-sm text-gray-600">Manage pharmacy settings</div>
              </div>
            </div>
          </Link>

          <Link href="/admin/medication-catalog">
            <div className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 flex items-center gap-4 cursor-pointer">
              <Pill className="h-6 w-6 text-gray-700" />
              <div>
                <div className="font-semibold text-base">View Medications</div>
                <div className="text-sm text-gray-600">Browse medication catalog</div>
              </div>
            </div>
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
