"use client";

import type { Order } from "../types";
import { getLatestOrderStatus } from "../utils";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderStatusDisplayProps {
  order: Order;
  className?: string;
}

export function OrderStatusDisplay({ order, className }: OrderStatusDisplayProps) {
  const latestStatus = getLatestOrderStatus(order);
  const cancellationRequested = order.payment_details?.requested_cancel || false;
  const hasSubscription = order.payment_details?.subscription_type !== undefined;

  // If cancellation is requested, show that as the primary status
  if (hasSubscription && cancellationRequested) {
    return (
      <div className={className || ""}>
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
          Cancellation Requested
        </span>
      </div>
    );
  }

  // Otherwise show the regular order status
  return (
    <div className={className || ""}>
      <OrderStatusBadge status={latestStatus} />
    </div>
  );
} 