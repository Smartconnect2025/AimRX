"use client";

import { useState, useEffect } from "react";
import { useSupabaseOrders } from "./useSupabaseOrders";

export function useOrderDetail(orderId: string) {
  const { currentOrder, loading, getOrder } = useSupabaseOrders();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const foundOrder = await getOrder(orderId);

        if (!foundOrder) {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Error loading order:", err);
        setError("Failed to load order");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, getOrder]);

  return {
    order: currentOrder,
    isLoading: isLoading || loading,
    error,
    notFound: !isLoading && !loading && !currentOrder && !error,
  };
}
