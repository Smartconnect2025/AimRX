import type { UserPhysicalAddress } from "@/features/checkout/types";
import { createClient } from "@core/supabase";
import type {
  Order as DBOrder,
  OrderLineItem as DBOrderLineItem,
  OrderActivity as DBOrderActivity,
  InsertOrderLineItem,
} from "@/core/database/schema";
import { orderRequiresAppointment } from "@/features/basic-emr/config/order-types";
import { flowFactory } from "@/features/basic-emr/services/flowFactory";
import type {
  Activity,
  Address,
  Order,
  OrderItem,
  OrderStatus,
  PaymentDetails,
} from "../types";

// Updated to work with Stripe pricing
type CreateOrderLineItem = Omit<
  InsertOrderLineItem,
  "id" | "order_id" | "subscription_price"
> & {
  stripe_price_id?: string; // Add Stripe price ID
};

export interface CreateOrderData {
  user_id: string;
  patient_id: string; // Add patient_id for encounter creation
  shipping_address_id: string;
  billing_address_id?: string;
  line_items: CreateOrderLineItem[];
  payment_details?: PaymentDetails;
  order_type?: string; // Add order type for sync/async determination
}

/**
 * Create a new order with line items, initial activity, and encounter
 */
export async function createOrder(data: CreateOrderData) {
  try {
    const supabase = createClient();

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: data.user_id,
        shipping_address_id: data.shipping_address_id,
        billing_address_id: data.billing_address_id,
        payment_details: data.payment_details,
        status: "pending", // Default status for new orders
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create line items
    const lineItemsData = data.line_items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id, // Assuming product_id is numeric
      name: item.name,
      price: item.price,
      subscription_price: item.price, // Use price as subscription_price for now
      image_url: item.image_url,
    }));

    const { error: lineItemsError } = await supabase
      .from("order_line_items")
      .insert(lineItemsData);

    if (lineItemsError) throw lineItemsError;

    // Create initial activity
    const { error: activityError } = await supabase
      .from("order_activities")
      .insert({
        order_id: order.id,
        status: "Order Placed",
        date: new Date().toISOString(),
      });

    if (activityError) throw activityError;

    // Determine order type from line items if not provided
    let orderType = data.order_type;
    if (!orderType && data.line_items && data.line_items.length > 0) {
      const itemNames = data.line_items.map(
        (item) => item.name?.toLowerCase() || "",
      );

      console.log("Order creation - line items:", itemNames);

      if (
        itemNames.some(
          (name) => name.includes("trt") || name.includes("testosterone"),
        )
      ) {
        orderType = "TRT";
      } else if (
        itemNames.some(
          (name) =>
            name.includes("weight loss") ||
            name.includes("weight-loss") ||
            name.includes("weightloss") ||
            name.includes("semaglutide") ||
            name.includes("ozempic") ||
            name.includes("wegovy"),
        )
      ) {
        orderType = "weight_loss";
      } else if (
        itemNames.some(
          (name) =>
            name.includes("controlled") ||
            name.includes("mental health") ||
            name.includes("adhd") ||
            name.includes("anxiety") ||
            name.includes("depression"),
        )
      ) {
        orderType = "controlled_medication";
      } else if (itemNames.some((name) => name.includes("lab"))) {
        orderType = "lab_test";
      } else {
        orderType = "medication"; // Default to async
      }

      console.log("Order creation - detected order type:", orderType);
    } else {
      orderType = orderType || "medication"; // Default to async
    }

    const requiresAppointment = orderRequiresAppointment(orderType);

    let encounter = null;

    if (requiresAppointment) {
      // For sync orders, don't create encounter yet - patient needs to schedule appointment first
      // Return order with a flag indicating appointment is required
      return {
        order,
        encounter: null,
        requiresAppointment: true,
        orderType,
      };
    } else {
      // For async orders, use flowFactory to create encounter
      const flowResult = await flowFactory.createOrderFlow({
        orderId: order.id,
        patientId: data.patient_id,
        orderType,
        userId: data.user_id,
      });

      if (!flowResult.success) {
        throw new Error(flowResult.error || "Failed to create order flow");
      }

      // Fetch the created encounter
      const { data: encounterData, error: encounterError } = await supabase
        .from("encounters")
        .select("*")
        .eq("id", flowResult.encounterId)
        .single();

      if (encounterError) throw encounterError;
      encounter = encounterData;
    }

    return { order, encounter, requiresAppointment: false, orderType };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Update order status (for provider approval/rejection)
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) throw error;

    // Add activity for status change
    const activityStatus =
      status === "approved"
        ? "Provider Approved"
        : status === "rejected"
          ? "Provider Rejected"
          : status === "cancelled"
            ? "Order Cancelled"
            : "Order Placed";

    await addOrderActivity(orderId, activityStatus);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

/**
 * Get all orders for a user with full details
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const supabase = createClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_line_items (*),
        order_activities (*),
        shipping_address:user_addresses!orders_shipping_address_id_user_addresses_id_fk (*),
        billing_address:user_addresses!orders_billing_address_id_user_addresses_id_fk (*)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return orders.map(transformDatabaseOrderToOrder);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const supabase = createClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_line_items (*),
        order_activities (*),
        shipping_address:user_addresses!orders_shipping_address_id_user_addresses_id_fk (*),
        billing_address:user_addresses!orders_billing_address_id_user_addresses_id_fk (*)
      `,
      )
      .eq("id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Order not found
      }
      throw error;
    }

    return transformDatabaseOrderToOrder(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}

/**
 * Add a new activity to an order
 */
export async function addOrderActivity(orderId: string, status: string) {
  try {
    const supabase = createClient();

    const { error } = await supabase.from("order_activities").insert({
      order_id: orderId,
      status,
      date: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error adding order activity:", error);
    throw error;
  }
}

/**
 * Get orders for provider dashboard (filtered by state)
 */
export async function getProviderOrders(
  providerLicensedState?: string,
): Promise<Order[]> {
  try {
    const supabase = createClient();

    const query = supabase
      .from("orders")
      .select(
        `
        *,
        order_line_items (*),
        order_activities (*),
        shipping_address:user_addresses!orders_shipping_address_id_user_addresses_id_fk(*),
        billing_address:user_addresses!orders_billing_address_id_user_addresses_id_fk(*)
      `,
      )
      .order("created_at", { ascending: false });

    const { data: _orders, error } = await query;
    const orders = _orders ?? [];
    // Filter by state if provided
    const filteredOrders = providerLicensedState
      ? orders.filter(
          (order) => order.shipping_address?.state === providerLicensedState,
        )
      : orders;

    if (error) throw error;

    return filteredOrders.map(transformDatabaseOrderToOrder);
  } catch (error) {
    console.error("Error fetching provider orders:", error);
    throw error;
  }
}

/**
 * Transform database order to application order format
 */
function transformDatabaseOrderToOrder(
  dbOrder: DBOrder & {
    order_line_items: DBOrderLineItem[];
    order_activities: DBOrderActivity[];
    shipping_address: UserPhysicalAddress;
    billing_address?: UserPhysicalAddress;
  },
): Order {
  // Calculate order total from line items
  const total = dbOrder.order_line_items.reduce(
    (sum: number, item: DBOrderLineItem) => {
      return sum + item.price / 100; // Convert cents to dollars
    },
    0,
  );

  // Transform line items
  const line_items: OrderItem[] = dbOrder.order_line_items.map(
    (item: DBOrderLineItem) => ({
      id: item.product_id.toString(),
      name: item.name,
      price: item.price,
      subscription_price: item.subscription_price,
      image_url: item.image_url || undefined,
      product_id: item.product_id,
      quantity: item.quantity || 1,
      stripe_price_id: item.stripe_price_id || null,
    }),
  );

  // Transform activities
  const activities: Activity[] = dbOrder.order_activities
    .map((activity: DBOrderActivity) => ({
      status: activity.status as OrderStatus,
      date: new Date(activity.date).toISOString(),
    }))
    .sort(
      (a: Activity, b: Activity) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  // Get the latest status from orders table
  const status = dbOrder.status as OrderStatus;

  // Transform address
  const shipping_address: Address = {
    first_name: dbOrder.shipping_address.given_name,
    last_name: dbOrder.shipping_address.family_name,
    phone_number: dbOrder.shipping_address.phone || "",
    address:
      dbOrder.shipping_address.address_line_1 +
      (dbOrder.shipping_address.address_line_2
        ? ", " + dbOrder.shipping_address.address_line_2
        : ""),
    city: dbOrder.shipping_address.city,
    state: dbOrder.shipping_address.state,
    postal_code: dbOrder.shipping_address.postal_code,
  };

  const billing_address: Address | undefined = dbOrder.billing_address
    ? {
        first_name: dbOrder.billing_address.given_name,
        last_name: dbOrder.billing_address.family_name,
        phone_number: dbOrder.billing_address.phone || "",
        address:
          dbOrder.billing_address.address_line_1 +
          (dbOrder.billing_address.address_line_2
            ? ", " + dbOrder.billing_address.address_line_2
            : ""),
        city: dbOrder.billing_address.city,
        state: dbOrder.billing_address.state,
        postal_code: dbOrder.billing_address.postal_code,
      }
    : undefined;

  return {
    id: dbOrder.id,
    created_at: new Date(dbOrder.created_at).toISOString(),
    updated_at: new Date(dbOrder.updated_at).toISOString(),
    user_id: dbOrder.user_id,
    shipping_address,
    billing_address,
    line_items,
    order_total: { total },
    activities,
    payment_details: (dbOrder.payment_details as PaymentDetails) || undefined,
    status,
    stripe_session_id: dbOrder.stripe_session_id,
    stripe_subscription_id: dbOrder.stripe_subscription_id,
  };
}
