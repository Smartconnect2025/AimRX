/**
 * OrderCard Component
 *
 * Mobile card view for displaying individual provider orders.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderCardProps } from "../types";
import { formatOrderDate, getOrderStatusClassName } from "../utils";
import { Lock } from "lucide-react";

export function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="bg-white rounded-lg border-gray-100 shadow-sm p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">{order.patient_name}</div>
        <span className={getOrderStatusClassName(order.status)}>
          {order.status}
        </span>
      </div>

      <div className="flex justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          #{order.order_number}
          {order.is_locked && (
            <div
              title={`Order locked ${order.locked_by ? `by ${order.locked_by}` : ""}`}
            >
              <Lock className="h-3 w-3 text-orange-500" />
            </div>
          )}
        </div>
        <div>{formatOrderDate(order.created_at)}</div>
        <div>Qty: {order.quantity}</div>
      </div>

      <Button variant="default" size="sm" asChild disabled={order.is_locked}>
        <Link href={`/provider/orders/${order.order_number}`}>Review</Link>
      </Button>
    </div>
  );
}
