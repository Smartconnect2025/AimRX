/**
 * OrderTable Component
 *
 * Desktop table view for displaying provider orders.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderTableProps } from "../types";
import { formatOrderDate, getOrderStatusClassName } from "../utils";
import { Lock } from "lucide-react";

export function OrderTable({ orders, isLoading }: OrderTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border-gray-100 shadow-sm overflow-hidden hidden md:block">
        <div className="p-8 text-center text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-gray-100 shadow-sm overflow-hidden hidden md:block">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Patient
              </TableHead>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Order number
              </TableHead>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Date
              </TableHead>
              <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                Quantity
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
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="p-4 whitespace-nowrap">
                    {order.patient_name}
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      #{order.order_number}
                      {order.is_locked && (
                        <div
                          title={`Order locked ${order.locked_by ? `by ${order.locked_by}` : ""}`}
                        >
                          <Lock className="h-3 w-3 text-orange-500" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    {formatOrderDate(order.created_at)}
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    {order.quantity}
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    <span className={getOrderStatusClassName(order.status)}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="p-4 whitespace-nowrap">
                    <Button size="sm" asChild disabled={order.is_locked}>
                      <Link href={`/provider/orders/${order.order_number}`}>
                        Review
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-gray-500"
                >
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
