import { format } from "date-fns";
import type { Order, OrderStatus } from "./types";
import { ORDER_STATUS_CLASSES, ORDERS_CONFIG } from "./constants";

/**
 * Get appropriate CSS classes for order status badges
 */
export function getOrderStatusClassNames(status: OrderStatus): string {
  return ORDER_STATUS_CLASSES[status] || ORDER_STATUS_CLASSES["pending"];
}

/**
 * Format order date for display
 */
export function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "M/d/yyyy");
}

/**
 * Format order date with time for detail view
 */
export function formatOrderDateTime(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "MM/dd/yyyy h:mm:ss a");
}

/**
 * Generate mock orders for demo purposes
 */
export function generateMockOrders(): Order[] {
  const now = Date.now();

  const mockOrders: Order[] = [
    // Recent order - Pending Review
    {
      id: "100068",
      created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updated_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      user_id: ORDERS_CONFIG.DEMO_USER_ID,
      status: "pending",
      shipping_address: {
        first_name: "Neha",
        last_name: "K",
        phone_number: "(814) 862-8075",
        address: "123 Main Street",
        city: "Boston",
        state: "MA",
        postal_code: "12345",
      },
      line_items: [
        {
          id: "orlistat",
          name: "Orlistat",
          price: 4900,
          subscription_price: 4900,
          image_url: undefined,
          product_id: 1,
          quantity: 1,
          stripe_price_id: null,
        },
      ],
      order_total: { total: 49.0 },
      activities: [
        {
          status: "pending",
          date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      payment_details: {
        subscription_type: "monthly",
        cardholderName: "Neha K",
        last4: "4242",
        requested_cancel: false,
      },
      stripe_session_id: null,
      stripe_subscription_id: null,
    },

    // Older order - Approved
    {
      id: "100067",
      created_at: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      updated_at: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago (after approval)
      user_id: ORDERS_CONFIG.DEMO_USER_ID,
      status: "approved",
      shipping_address: {
        first_name: "Neha",
        last_name: "K",
        phone_number: "(814) 862-8075",
        address: "123 Main Street",
        city: "Boston",
        state: "MA",
        postal_code: "12345",
      },
      line_items: [
        {
          id: "garcinia-cambogia-extract",
          name: "Garcinia Cambogia Extract",
          price: 3900,
          subscription_price: 3900,
          image_url: undefined,
          product_id: 3,
          quantity: 1,
          stripe_price_id: null,
        },
      ],
      order_total: { total: 39.0 },
      activities: [
        {
          status: "pending",
          date: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          status: "approved",
          date: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      payment_details: {
        subscription_type: "discounted",
        cardholderName: "Neha K",
        last4: "4242",
        requested_cancel: false,
      },
      stripe_session_id: null,
      stripe_subscription_id: null,
    },

    // Cancelled subscription order
    {
      id: "100066",
      created_at: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
      updated_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago (shipped)
      user_id: ORDERS_CONFIG.DEMO_USER_ID,
      status: "cancelled",
      shipping_address: {
        first_name: "Neha",
        last_name: "K",
        phone_number: "(814) 862-8075",
        address: "123 Main Street",
        city: "Boston",
        state: "MA",
        postal_code: "12345",
      },
      line_items: [
        {
          id: "weight-management-combo",
          name: "Weight Management Combo",
          price: 7900,
          subscription_price: 7900,
          image_url: undefined,
          product_id: 4,
          quantity: 1,
          stripe_price_id: null,
        },
      ],
      order_total: { total: 79.0 },
      activities: [
        {
          status: "pending",
          date: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          status: "approved",
          date: new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          status: "cancelled",
          date: new Date(now - 22 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      payment_details: {
        subscription_type: "monthly",
        cardholderName: "Neha K",
        last4: "4242",
        requested_cancel: true,
      },
      stripe_session_id: null,
      stripe_subscription_id: null,
    },
  ];

  return mockOrders;
}

/**
 * Get orders from localStorage or return mock data
 */
export function getStoredOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDERS_CONFIG.STORAGE_KEY);
    if (stored) {
      const orders = JSON.parse(stored);
      return Array.isArray(orders) ? orders : [];
    }
  } catch (error) {
    console.error("Error reading orders from localStorage:", error);
  }

  return generateMockOrders();
}

/**
 * Save orders to localStorage
 */
export function saveOrdersToStorage(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_CONFIG.STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Error saving orders to localStorage:", error);
  }
}

/**
 * Add a new order to storage
 */
export function addOrderToStorage(order: Order): void {
  const existingOrders = getStoredOrders();
  const updatedOrders = [order, ...existingOrders];
  saveOrdersToStorage(updatedOrders);
}

/**
 * Find order by ID
 */
export function findOrderById(orderId: string): Order | null {
  const orders = getStoredOrders();
  return orders.find((order) => order.id === orderId) || null;
}

/**
 * Get latest activity status for an order
 */
export function getLatestOrderStatus(order: Order): OrderStatus {
  if (order.activities && order.activities.length > 0) {
    return order.activities[order.activities.length - 1].status;
  }
  return order.status || "pending";
}

/**
 * Check if order has active subscription
 */
export function hasActiveSubscription(order: Order): boolean {
  const latestStatus = getLatestOrderStatus(order);
  const hasPaymentDetails =
    order.payment_details?.subscription_type !== undefined;
  const isNotCancelled = !order.payment_details?.requested_cancel;

  // Consider subscription active if there are payment details and it's not cancelled
  // and the order is not rejected or cancelled
  return (
    hasPaymentDetails &&
    isNotCancelled &&
    latestStatus !== "rejected" &&
    latestStatus !== "cancelled"
  );
}

/**
 * Calculate next billing date (30 days from order date)
 */
export function getNextBillingDate(orderDate: string): Date {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + 30);
  return date;
}
