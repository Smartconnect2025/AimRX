"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Order } from "../types";
import { formatOrderDate } from "../utils";
import { OrderStatusDisplay } from "./OrderStatusDisplay";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const orderDate = formatOrderDate(order.created_at);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium">#{order.id}</div>
        <OrderStatusDisplay order={order} />
      </div>

      <div className="flex justify-between text-sm text-gray-500 mb-3">
        <div>{orderDate}</div>
        <div>${order.order_total.total.toFixed(2)}/mo</div>
      </div>

      <Button
        className="w-full bg-primary hover:bg-primary/90 text-white"
        size="sm"
        asChild
      >
        <Link href={`/orders/${order.id}`}>View Order Details</Link>
      </Button>
    </div>
  );
}
