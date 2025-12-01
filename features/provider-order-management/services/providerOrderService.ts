/**
 * Provider Order Service
 *
 * Service for fetching and managing provider orders data.
 * Now integrated with Supabase backend.
 */

import {
  getProviderOrders,
  updateOrderStatus,
} from "@/features/orders/services/orderService";
import type { Order } from "@/features/orders/types";
import {
  ProviderDashboardFilters,
  ProviderLicenseInfo,
  ProviderOrder,
} from "../types";
import { getStateName, searchMatches } from "../utils";

/**
 * Transform Order to ProviderOrder format
 */
function transformOrderToProviderOrder(order: Order): ProviderOrder {
  // Calculate total quantity
  const quantity = order.line_items.reduce((sum, _item) => sum + 1, 0); // Assuming quantity is 1 per line item

  // Transform line items
  const line_items = order.line_items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price / 100, // Convert cents to dollars
    quantity: 1, // Assuming 1 quantity per item
  }));

  // Determine review status based on order status
  const getReviewStatus = (
    status: string,
  ): "not_started" | "in_review" | "approved" | "rejected" => {
    switch (status) {
      case "approved":
        return "approved";
      case "rejected":
      case "cancelled":
        return "rejected";
      case "pending":
        return "not_started";
      default:
        return "not_started";
    }
  };

  return {
    id: order.id,
    order_number: order.id,
    created_at: order.created_at,
    user_id: order.user_id,
    patient_name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
    patient_email: undefined, // Not available in Order type
    shipping_address: {
      first_name: order.shipping_address.first_name,
      last_name: order.shipping_address.last_name,
      address: order.shipping_address.address,
      city: order.shipping_address.city,
      state: order.shipping_address.state,
      postal_code: order.shipping_address.postal_code,
      phone_number: order.shipping_address.phone_number,
    },
    line_items,
    quantity,
    status: order.status, // Type assertion since OrderStatus and ProviderOrderStatus overlap
    review_status: getReviewStatus(order.status),
    activities: order.activities.map((activity) => ({
      status: activity.status,
      date: activity.date,
    })),
  };
}

export const providerOrderService = {
  /**
   * Get provider's licensed state information
   */
  async getProviderLicenseInfo(
    _providerId: string,
  ): Promise<ProviderLicenseInfo> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock: Provider is licensed in Arizona
    const licensedState = "AZ";
    return {
      licensedState,
      fullStateName: getStateName(licensedState),
    };
  },

  /**
   * Get orders for a provider with filtering and pagination
   */
  async getProviderOrders(
    providerId: string,
    filters: ProviderDashboardFilters,
  ): Promise<{
    orders: ProviderOrder[];
    totalOrders: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      // Get provider's licensed state
      const licenseInfo = await this.getProviderLicenseInfo(providerId);

      // Get orders from Supabase filtered by licensed state
      const orders = await getProviderOrders(
        licenseInfo.licensedState || undefined,
      );

      // Transform orders to ProviderOrder format
      let providerOrders = orders.map(transformOrderToProviderOrder);

      // Apply search filter
      if (filters.search) {
        providerOrders = providerOrders.filter((order) =>
          searchMatches(filters.search!, order),
        );
      }

      // Apply status filters
      if (filters.status) {
        providerOrders = providerOrders.filter(
          (order) => order.status === filters.status,
        );
      }

      if (filters.reviewStatus) {
        providerOrders = providerOrders.filter(
          (order) => order.review_status === filters.reviewStatus,
        );
      }

      // Sort by created_at descending (newest first)
      providerOrders.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      // Calculate pagination
      const totalOrders = providerOrders.length;
      const totalPages = Math.ceil(totalOrders / filters.pageSize);
      const startIndex = (filters.page - 1) * filters.pageSize;
      const endIndex = startIndex + filters.pageSize;
      const paginatedOrders = providerOrders.slice(startIndex, endIndex);

      return {
        orders: paginatedOrders,
        totalOrders,
        totalPages,
        currentPage: filters.page,
      };
    } catch (error) {
      console.error("Error fetching provider orders:", error);
      throw error;
    }
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<ProviderOrder | null> {
    try {
      const { getOrderById } = await import(
        "@/features/orders/services/orderService"
      );
      const order = await getOrderById(orderId);

      if (!order) {
        return null;
      }

      return transformOrderToProviderOrder(order);
    } catch (error) {
      console.error("Error fetching order by ID:", error);
      throw error;
    }
  },

  /**
   * Approve an order
   */
  async approveOrder(orderId: string, providerId: string): Promise<boolean> {
    try {
      await updateOrderStatus(orderId, "approved");
      console.log(`Order ${orderId} approved by provider ${providerId}`);
      return true;
    } catch (error) {
      console.error("Error approving order:", error);
      throw error;
    }
  },

  /**
   * Reject an order
   */
  async rejectOrder(orderId: string, providerId: string): Promise<boolean> {
    try {
      await updateOrderStatus(orderId, "rejected");
      console.log(`Order ${orderId} rejected by provider ${providerId}`);
      return true;
    } catch (error) {
      console.error("Error rejecting order:", error);
      throw error;
    }
  },

  /**
   * Lock an order for review
   */
  async lockOrderForReview(
    orderId: string,
    providerId: string,
  ): Promise<boolean> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    // In a real implementation, this would update the database
    console.log(`Locking order ${orderId} for provider ${providerId}`);
    return true;
  },

  /**
   * Unlock an order
   */
  async unlockOrder(orderId: string, providerId: string): Promise<boolean> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    // In a real implementation, this would update the database
    console.log(`Unlocking order ${orderId} by provider ${providerId}`);
    return true;
  },
};
