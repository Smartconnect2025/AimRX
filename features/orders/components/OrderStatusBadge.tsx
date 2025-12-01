"use client";

import type { OrderStatus } from "../types";
import { getOrderStatusClassNames } from "../utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span className={`${getOrderStatusClassNames(status)} ${className || ""}`}>
      {status}
    </span>
  );
} 