/**
 * useProviderOrders Hook
 * 
 * Custom hook for managing provider orders data, filtering, and pagination.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@core/auth";
import { providerOrderService } from "../services/providerOrderService";
import { ProviderDashboardFilters, ProviderDashboardData, ProviderLicenseInfo } from "../types";
import { PAGINATION_CONFIG } from "../constants";

interface UseProviderOrdersReturn extends ProviderDashboardData {
  licenseInfo: ProviderLicenseInfo;
  filters: ProviderDashboardFilters;
  updateFilters: (newFilters: Partial<ProviderDashboardFilters>) => void;
  refreshOrders: () => Promise<void>;
  handleSearch: (searchQuery: string) => void;
  handlePageChange: (page: number) => void;
  reviewOrder: (orderId: string) => void;
}

export function useProviderOrders(): UseProviderOrdersReturn {
  const { user, userRole } = useUser();
  
  // State for orders data
  const [orders, setOrders] = useState<ProviderDashboardData["orders"]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  
  // State for license info
  const [licenseInfo, setLicenseInfo] = useState<ProviderLicenseInfo>({
    licensedState: null,
    fullStateName: null
  });
  
  // State for filters
  const [filters, setFilters] = useState<ProviderDashboardFilters>({
    search: "",
    page: 1,
    pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE
  });

  // Fetch orders data
  const fetchOrders = useCallback(async () => {
    if (!user?.id || userRole !== "provider") {
      setIsLoading(false);
      setError("Provider authentication required");
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      // Fetch license info and orders in parallel
      const [licenseData, ordersData] = await Promise.all([
        providerOrderService.getProviderLicenseInfo(user.id),
        providerOrderService.getProviderOrders(user.id, filters)
      ]);

      setLicenseInfo(licenseData);
      setOrders(ordersData.orders);
      setTotalOrders(ordersData.totalOrders);
      setTotalPages(ordersData.totalPages);
      setCurrentPage(ordersData.currentPage);
    } catch (err) {
      console.error("Error fetching provider orders:", err);
      setError("Failed to load orders. Please try again.");
      setOrders([]);
      setTotalOrders(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, userRole, filters]);

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update filters and reset to page 1 if needed
  const updateFilters = useCallback((newFilters: Partial<ProviderDashboardFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Reset to page 1 if search or other filters change (but not if just page changes)
      if (newFilters.search !== undefined || newFilters.status !== undefined || newFilters.reviewStatus !== undefined) {
        updated.page = 1;
      }
      
      return updated;
    });
  }, []);

  // Refresh orders (useful for manual refresh)
  const refreshOrders = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  // Handle search with debouncing effect handled by the component
  const handleSearch = useCallback((searchQuery: string) => {
    updateFilters({ search: searchQuery });
  }, [updateFilters]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  // Handle order review action
  const reviewOrder = useCallback((orderId: string) => {
    // For now, just log the action. In the future, this could:
    // 1. Lock the order for review
    // 2. Navigate to order detail page
    // 3. Open a modal for review
    console.log(`Reviewing order ${orderId}`);
    
    // Placeholder: Navigate to order review page
    if (typeof window !== "undefined") {
      window.location.href = `/provider/orders/${orderId}`;
    }
  }, []);

  return {
    // Data
    orders,
    totalOrders,
    totalPages,
    currentPage,
    isLoading,
    error,
    licenseInfo,
    filters,
    
    // Actions
    updateFilters,
    refreshOrders,
    handleSearch,
    handlePageChange,
    reviewOrder
  };
} 