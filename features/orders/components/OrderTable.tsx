"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import type { Order } from "../types";
import { formatOrderDate } from "../utils";
import { OrderStatusDisplay } from "./OrderStatusDisplay";
import { ORDER_MESSAGES } from "../constants";

interface OrderTableProps {
  orders: Order[];
  className?: string;
}

export function OrderTable({ orders, className }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm p-6 text-center text-gray-500 ${className || ""}`}
      >
        {ORDER_MESSAGES.NO_ORDERS}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className || ""}`}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Order number
              </TableHead>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Date
              </TableHead>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Total amount
              </TableHead>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Status
              </TableHead>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const orderDate = formatOrderDate(order.created_at);

              return (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="p-4 whitespace-nowrap">
                    #{order.id}
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    {orderDate}
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    ${order.order_total.total.toFixed(2)}/mo
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    <OrderStatusDisplay order={order} />
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="default"
                      className="rounded-lg"
                      asChild
                    >
                      <Link href={`/orders/${order.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
