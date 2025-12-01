import type { OrderStatus } from "./types";

export const ORDERS_CONFIG = {
  PAGE_SIZE: 10,
  STORAGE_KEY: "userOrders",
  DEMO_USER_ID: "user123",
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
} as const;

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  pending:
    "px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium",
  approved:
    "px-2 py-1 bg-green-500/10 text-green-700 rounded-full text-xs font-medium",
  rejected:
    "px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium",
  cancelled:
    "px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium",
} as const;

export const ORDER_MESSAGES = {
  NO_ORDERS: "No orders found",
  LOADING: "Loading orders...",
  ORDER_NOT_FOUND: "Order not found",
} as const;
