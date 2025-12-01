"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "../types";

interface AddressesCardProps {
  order: Order;
}

export function AddressesCard({ order }: AddressesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Addresses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Shipping Address</h3>
            <div className="text-gray-700 space-y-1">
              <p className="font-medium">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p>{order.shipping_address.phone_number}</p>
              <p>{order.shipping_address.address}</p>
              <p>
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
              </p>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Billing Address</h3>
            {order.billing_address ? (
              <div className="text-gray-700 space-y-1">
                <p className="font-medium">
                  {order.billing_address.first_name} {order.billing_address.last_name}
                </p>
                <p>{order.billing_address.phone_number}</p>
                <p>{order.billing_address.address}</p>
                <p>
                  {order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Same as shipping address</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 