/**
 * ProviderOrderDashboard Component
 *
 * Main dashboard component for provider order management.
 */

"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";
import { useProviderOrders } from "../hooks/useProviderOrders";
import { ProviderOrderDashboardProps } from "../types";
import { SearchBar } from "./SearchBar";
import { LicensedStateAlert } from "./LicensedStateAlert";
import { OrderTable } from "./OrderTable";
import { OrderCard } from "./OrderCard";
import { OrderPagination } from "./OrderPagination";

export function ProviderOrderDashboard({
  className,
}: ProviderOrderDashboardProps) {
  const {
    orders,
    totalOrders,
    totalPages,
    currentPage,
    isLoading,
    error,
    licenseInfo,
    filters,
    handleSearch,
    handlePageChange,
    reviewOrder,
    refreshOrders,
  } = useProviderOrders();

  // Handle back navigation
  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  // Handle search submission
  const handleSearchSubmit = () => {
    // Search is already handled by the debounced onChange
    // This could trigger an immediate search if needed
  };

  if (error) {
    return (
      <div className={cn("flex-1 bg-background min-h-screen", className)}>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border-gray-100 shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={refreshOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 bg-background min-h-screen", className)}>
      <div className="container mx-auto px-4 pb-16 relative">
        {/* Back Button */}
        <div className="pt-4 pb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Search and Title Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          {/* Search Bar */}
          <SearchBar
            searchQuery={filters.search || ""}
            onSearchChange={handleSearch}
            onSearchSubmit={handleSearchSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* Licensed State Alert */}
        <LicensedStateAlert licenseInfo={licenseInfo} />

        {/* Desktop Table View */}
        <OrderTable
          orders={orders}
          isLoading={isLoading}
          onReviewOrder={reviewOrder}
        />

        {/* Mobile Card View */}
        <div className="space-y-4 md:hidden">
          {isLoading ? (
            <div className="bg-white rounded-lg border-gray-100 shadow-sm p-6 text-center text-gray-500">
              Loading orders...
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReviewOrder={reviewOrder}
              />
            ))
          ) : (
            <div className="bg-white rounded-lg border-gray-100 shadow-sm p-6 text-center text-gray-500">
              {filters.search
                ? "No orders found matching your search"
                : "No orders found"}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && (
          <OrderPagination
            currentPage={currentPage}
            totalPages={totalPages}
            searchQuery={filters.search}
            onPageChange={handlePageChange}
          />
        )}

        {/* Orders Summary */}
        {!isLoading && orders.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {orders.length} of {totalOrders} orders
            {licenseInfo.fullStateName && ` from ${licenseInfo.fullStateName}`}
          </div>
        )}
      </div>
    </div>
  );
}
