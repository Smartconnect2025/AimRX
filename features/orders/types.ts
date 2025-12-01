// Import database schema types
import type {
  Order as DBOrder,
  OrderLineItem as DBOrderLineItem,
  OrderActivity as DBOrderActivity,
} from "@/core/database/schema";

// Frontend Address interface (maps to UserAddress schema)
export interface Address {
  first_name: string; // Maps to given_name in UserAddress
  last_name: string; // Maps to family_name in UserAddress
  phone_number: string; // Maps to phone in UserAddress
  address: string; // Combination of address_line_1 + address_line_2
  city: string;
  state: string;
  postal_code: string;
}

// Frontend OrderItem extending database schema
export interface OrderItem
  extends Omit<DBOrderLineItem, "order_id" | "product_id" | "image_url"> {
  id: string;
  name: string;
  price: number; // Database stores in cents, frontend uses dollars
  subscription_price: number; // Database stores in cents, frontend uses dollars
  image_url?: string; // Frontend uses undefined, database uses null
  product_id: number; // Keep for database compatibility
  quantity: number; // Added for order line items
  stripe_price_id: string | null; // Added for Stripe integration
}

// Frontend Activity extending database schema
export interface Activity
  extends Omit<DBOrderActivity, "id" | "order_id" | "date"> {
  status: OrderStatus;
  date: string; // Convert Date to string for frontend display
}

// Frontend Order interface extending database schema with joined data
export interface Order
  extends Omit<
    DBOrder,
    | "shipping_address_id"
    | "billing_address_id"
    | "created_at"
    | "updated_at"
    | "payment_details"
  > {
  id: string;
  created_at: string; // Convert Date to string for frontend display
  updated_at: string; // Convert Date to string for frontend display
  user_id: string;

  // Joined address data (resolved from IDs)
  shipping_address: Address;
  billing_address?: Address;

  // Joined related data
  line_items: OrderItem[];
  activities: Activity[];

  // Computed fields
  order_total: { total: number };
  status: OrderStatus; // Now from orders.status field

  // Payment details (from JSONB field)
  payment_details?: PaymentDetails;

  // Stripe integration fields
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
}

export interface PaymentDetails {
  subscription_type: "monthly" | "discounted";
  cardholderName: string;
  last4: string;
  requested_cancel?: boolean;
}

export type OrderStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
}

export interface OrderDetailProps {
  order: Order;
  isLoading: boolean;
}

// Database operation types (re-export for CRUD operations)
export type {
  InsertOrder as CreateOrderData,
  InsertOrderLineItem as CreateOrderLineItemData,
  InsertOrderActivity as CreateOrderActivityData,
  UpdateOrder as UpdateOrderData,
  UpdateOrderLineItem as UpdateOrderLineItemData,
  UpdateOrderActivity as UpdateOrderActivityData,
} from "@/core/database/schema";
