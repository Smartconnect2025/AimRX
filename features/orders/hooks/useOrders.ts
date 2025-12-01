"use client";

import { useState, useEffect } from "react";
import { ORDERS_CONFIG } from "../constants";
import { useUser } from "@core/auth";
import { useSupabaseOrders } from "./useSupabaseOrders";

export function useOrders(page: number = 1) {
  const { user } = useUser();
  const { orders, loading, getOrders } = useSupabaseOrders();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        await getOrders(user.id);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();

    // Listen for focus event to refresh data when user navigates back
    const handleFocus = () => {
      if (user?.id) {
        getOrders(user.id);
      }
    };

    // Listen for custom orders-updated event
    const handleOrdersUpdate = () => {
      if (user?.id) {
        getOrders(user.id);
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("orders-updated", handleOrdersUpdate);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("orders-updated", handleOrdersUpdate);
    };
  }, [user?.id, getOrders]);

  // Pagination logic
  const pageSize = ORDERS_CONFIG.PAGE_SIZE;
  const totalOrders = orders.length;
  const totalPages = Math.ceil(totalOrders / pageSize);

  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  return {
    orders: paginatedOrders,
    allOrders: orders,
    totalPages,
    currentPage: page,
    totalOrders,
    isLoading: isLoading || loading,
    pageSize,
  };
}

export function useOrdersRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return { refreshKey, refresh };
}
