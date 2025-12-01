import { createClient } from "@/core/supabase/client";
import { createServerClient } from "@/core/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface OrderRecord {
  id: string;
  user_id: string;
  shipping_address_id: string;
  billing_address_id: string | null;
  payment_details: Record<string, string | number | boolean | null> | null;
  status: string;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  user_id: string;
  shipping_address_id: string;
  billing_address_id?: string | null;
  payment_details?: Record<string, string | number | boolean | null> | null;
  status?: string;
  stripe_session_id?: string | null;
  stripe_subscription_id?: string | null;
}

export interface OrderLineItemData {
  order_id: string;
  product_id: number;
  name: string;
  image_url?: string | null;
  quantity: number;
  price: number;
  subscription_price: number;
  stripe_price_id?: string | null;
}

export interface OrderActivityData {
  order_id: string;
  status: string;
  date?: string;
}

export interface UpdateOrderStripeData {
  stripe_session_id?: string | null;
  stripe_subscription_id?: string | null;
  payment_details?: Record<string, string | number | boolean | null> | null;
  status?: string;
}

export interface StripeOrderDbResult<T = OrderRecord> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Database service for managing orders with Stripe integration
 */
export class StripeOrderDbService {
  private supabase: SupabaseClient | null;
  private isServerSide: boolean;

  constructor(isServerSide = false) {
    this.isServerSide = isServerSide;
    if (isServerSide) {
      // Will be initialized in server-side methods
      this.supabase = null;
    } else {
      this.supabase = createClient();
    }
  }

  /**
   * Initialize server-side client (for use in API routes)
   */
  private async getServerClient(): Promise<SupabaseClient> {
    if (this.isServerSide && !this.supabase) {
      this.supabase = await createServerClient();
    }
    return this.supabase!;
  }

  /**
   * Create a new order with Stripe session ID
   */
  async createOrderWithStripeSession(
    data: CreateOrderData,
  ): Promise<StripeOrderDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data: result, error } = await client
        .from("orders")
        .insert([
          {
            user_id: data.user_id,
            shipping_address_id: data.shipping_address_id,
            billing_address_id: data.billing_address_id || null,
            payment_details: data.payment_details || null,
            status: data.status || "pending",
            stripe_session_id: data.stripe_session_id || null,
            stripe_subscription_id: data.stripe_subscription_id || null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating order with Stripe session:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Unexpected error creating order:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update order with Stripe data (session ID, subscription ID, etc.)
   */
  async updateOrderStripeData(
    orderId: string,
    stripeData: UpdateOrderStripeData,
  ): Promise<StripeOrderDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const updateData: Partial<OrderRecord> = {
        updated_at: new Date().toISOString(),
      };

      // Only update fields that are provided
      if (stripeData.stripe_session_id !== undefined) {
        updateData.stripe_session_id = stripeData.stripe_session_id;
      }
      if (stripeData.stripe_subscription_id !== undefined) {
        updateData.stripe_subscription_id = stripeData.stripe_subscription_id;
      }
      if (stripeData.payment_details !== undefined) {
        updateData.payment_details = stripeData.payment_details;
      }
      if (stripeData.status !== undefined) {
        updateData.status = stripeData.status;
      }

      const { data, error } = await client
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();

      if (error) {
        console.error("Error updating order with Stripe data:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected error updating order:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get order by Stripe session ID
   */
  async getOrderByStripeSessionId(
    sessionId: string,
  ): Promise<StripeOrderDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return { success: false, error: "Order not found" };
        }
        console.error("Error fetching order by session ID:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected error fetching order:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get order by Stripe subscription ID
   */
  async getOrderByStripeSubscriptionId(
    subscriptionId: string,
  ): Promise<StripeOrderDbResult> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("orders")
        .select("*")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return { success: false, error: "Order not found" };
        }
        console.error("Error fetching order by subscription ID:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected error fetching order:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(
    userId: string,
  ): Promise<StripeOrderDbResult<OrderRecord[]>> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders by user ID:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Unexpected error fetching orders:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create order line items for an order
   */
  async createOrderLineItems(
    lineItems: OrderLineItemData[],
  ): Promise<StripeOrderDbResult<OrderLineItemData[]>> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("order_line_items")
        .insert(lineItems)
        .select();

      if (error) {
        console.error("Error creating order line items:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Unexpected error creating order line items:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if order already exists by session ID (for duplicate prevention)
   */
  async orderExistsBySessionId(sessionId: string): Promise<boolean> {
    try {
      const result = await this.getOrderByStripeSessionId(sessionId);
      return result.success && !!result.data;
    } catch (error) {
      console.error("Error checking if order exists:", error);
      return false;
    }
  }

  /**
   * Create an order activity entry
   */
  async createOrderActivity(
    activityData: OrderActivityData,
  ): Promise<StripeOrderDbResult<OrderActivityData>> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const { data, error } = await client
        .from("order_activities")
        .insert([
          {
            order_id: activityData.order_id,
            status: activityData.status,
            date: activityData.date || new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating order activity:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Unexpected error creating order activity:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create multiple order activities
   */
  async createOrderActivities(
    activities: OrderActivityData[],
  ): Promise<StripeOrderDbResult<OrderActivityData[]>> {
    try {
      const client = this.isServerSide
        ? await this.getServerClient()
        : this.supabase!;

      const activitiesWithDates = activities.map((activity) => ({
        order_id: activity.order_id,
        status: activity.status,
        date: activity.date || new Date().toISOString(),
      }));

      const { data, error } = await client
        .from("order_activities")
        .insert(activitiesWithDates)
        .select();

      if (error) {
        console.error("Error creating order activities:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Unexpected error creating order activities:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Helper method to create order with initial activity
   */
  async createOrderWithActivity(
    orderData: CreateOrderData,
    initialStatus: string,
  ): Promise<StripeOrderDbResult> {
    try {
      // Create the order first
      const orderResult = await this.createOrderWithStripeSession(orderData);
      if (!orderResult.success || !orderResult.data) {
        return orderResult;
      }

      // Create the initial activity
      const activityResult = await this.createOrderActivity({
        order_id: orderResult.data.id,
        status: initialStatus,
      });

      if (!activityResult.success) {
        console.error(
          "Failed to create initial order activity:",
          activityResult.error,
        );
        // Don't fail the order creation, just log the error
        // TODO: Consider implementing retry logic or dead letter queue for failed activities
      }

      return orderResult;
    } catch (error) {
      console.error("Unexpected error creating order with activity:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update order status and create activity record
   */
  async updateOrderStatusWithActivity(
    orderId: string,
    newStatus: string,
    stripeData?: UpdateOrderStripeData,
  ): Promise<StripeOrderDbResult> {
    try {
      // Update the order
      const updateData = {
        ...stripeData,
        status: newStatus,
      };

      const orderResult = await this.updateOrderStripeData(orderId, updateData);
      if (!orderResult.success) {
        return orderResult;
      }

      // Create activity record
      const activityResult = await this.createOrderActivity({
        order_id: orderId,
        status: newStatus,
      });

      if (!activityResult.success) {
        console.error("Failed to create order activity:", activityResult.error);
        // Don't fail the order update, just log the error
        // TODO: Consider implementing retry logic or dead letter queue for failed activities
      }

      return orderResult;
    } catch (error) {
      console.error("Unexpected error updating order with activity:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instances for client and server use
export const stripeOrderDbService = new StripeOrderDbService(false);
export const stripeOrderDbServiceServer = new StripeOrderDbService(true);
