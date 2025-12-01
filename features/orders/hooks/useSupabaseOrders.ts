import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  addOrderActivity,
  getProviderOrders,
  type CreateOrderData,
} from "../services/orderService";
import type { Order } from "../types";

export function useSupabaseOrders() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  /**
   * Create a new order
   */
  const createOrderMutation = useCallback(
    async (data: CreateOrderData) => {
      setLoading(true);
      try {
        const order = await createOrder(data);
        toast.success("Order created successfully");

        // Refresh orders list if we have orders loaded
        if (orders.length > 0) {
          const userOrders = await getUserOrders(data.user_id);
          setOrders(userOrders);
        }

        return order;
      } catch (error) {
        console.error("Error creating order:", error);
        toast.error("Failed to create order");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [orders.length],
  );

  /**
   * Get all orders for a user
   */
  const getOrders = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const userOrders = await getUserOrders(userId);
      setOrders(userOrders);
      return userOrders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a specific order by ID
   */
  const getOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      const order = await getOrderById(orderId);
      setCurrentOrder(order);
      return order;
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order details");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update order status by adding a new activity
   */
  const updateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      setLoading(true);
      try {
        await addOrderActivity(orderId, status);

        // Update current order if it's the one being modified
        if (currentOrder?.id === orderId) {
          const updatedOrder = await getOrderById(orderId);
          setCurrentOrder(updatedOrder);
        }

        // Update orders list if the order exists in it
        const orderIndex = orders.findIndex((o) => o.id === orderId);
        if (orderIndex !== -1) {
          const updatedOrder = await getOrderById(orderId);
          if (updatedOrder) {
            const updatedOrders = [...orders];
            updatedOrders[orderIndex] = updatedOrder;
            setOrders(updatedOrders);
          }
        }

        toast.success("Order status updated");
      } catch (error) {
        console.error("Error updating order status:", error);
        toast.error("Failed to update order status");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentOrder, orders],
  );

  /**
   * Get orders for provider dashboard
   */
  const getProviderOrdersList = useCallback(
    async (providerLicensedState?: string) => {
      setLoading(true);
      try {
        const providerOrders = await getProviderOrders(providerLicensedState);
        setOrders(providerOrders);
        return providerOrders;
      } catch (error) {
        console.error("Error fetching provider orders:", error);
        toast.error("Failed to load provider orders");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Refresh orders list
   */
  const refreshOrders = useCallback(async (userId: string) => {
    try {
      const userOrders = await getUserOrders(userId);
      setOrders(userOrders);
      return userOrders;
    } catch (error) {
      console.error("Error refreshing orders:", error);
      throw error;
    }
  }, []);

  /**
   * Clear current order
   */
  const clearCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
  }, []);

  /**
   * Clear orders list
   */
  const clearOrders = useCallback(() => {
    setOrders([]);
  }, []);

  return {
    // State
    loading,
    orders,
    currentOrder,

    // Actions
    createOrder: createOrderMutation,
    getOrders,
    getOrder,
    updateOrderStatus,
    getProviderOrders: getProviderOrdersList,
    refreshOrders,
    clearCurrentOrder,
    clearOrders,
  };
}
