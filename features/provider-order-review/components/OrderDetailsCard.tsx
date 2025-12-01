"use client";

/**
 * Order Details Card Component
 * 
 * Displays order shipping, billing, and item information
 */

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderReviewData } from "../types";
import { formatCurrency, getStateName, formatPhoneNumber } from "../utils";

interface OrderDetailsCardProps {
  order: OrderReviewData;
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  return (
    <Card className="mb-6 border-gray-100">
      <CardHeader>
        <CardTitle>Order Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Shipping Address */}
          <div>
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <div className="space-y-1 text-sm">
              <p>
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p>{formatPhoneNumber(order.shipping_address.phone_number)}</p>
              <p>{order.shipping_address.address}</p>
              <p>
                {order.shipping_address.city}, {getStateName(order.shipping_address.state)} {order.shipping_address.postal_code}
              </p>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h3 className="font-semibold mb-2">Billing Address</h3>
            {order.billing_address ? (
              <div className="space-y-1 text-sm">
                <p>
                  {order.billing_address.first_name} {order.billing_address.last_name}
                </p>
                <p>{formatPhoneNumber(order.billing_address.phone_number)}</p>
                <p>{order.billing_address.address}</p>
                <p>
                  {order.billing_address.city}, {getStateName(order.billing_address.state)} {order.billing_address.postal_code}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Same as shipping address</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="font-semibold mb-4">Order Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.order_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {item.image_url && (
                        <div className="w-12 h-12 relative flex-shrink-0">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                            onError={(e) => {
                              // Hide image if it fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price * item.quantity)}
                    {item.price === 0 && "/mo"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Total */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">
              {formatCurrency(order.total_amount)}/mo
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 