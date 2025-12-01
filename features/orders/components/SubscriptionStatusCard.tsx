"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import type { Order } from "../types";
import { hasActiveSubscription, getNextBillingDate, formatOrderDate } from "../utils";

interface SubscriptionStatusCardProps {
  order: Order;
}

export function SubscriptionStatusCard({ order }: SubscriptionStatusCardProps) {
  const isActive = hasActiveSubscription(order);
  const cancellationRequested = order.payment_details?.requested_cancel || false;
  const nextBillingDate = isActive ? getNextBillingDate(order.created_at) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={`h-3 w-3 rounded-full ${
                isActive ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <div>
              <p className="font-medium">
                {isActive ? 'Active' : 'Inactive'}
                {cancellationRequested && isActive && " (Cancellation Pending)"}
              </p>
              {isActive && (
                <p className="text-sm text-gray-500">
                  {order.payment_details?.subscription_type === "discounted" 
                    ? "Discounted subscription" 
                    : "Monthly subscription"}
                </p>
              )}
            </div>
          </div>
          
          {isActive && !cancellationRequested && (
            <CancelSubscriptionDialog 
              order={order} 
              className="text-sm"
            />
          )}
        </div>

        {isActive && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Billing cycle</span>
              <span>Monthly</span>
            </div>
            {nextBillingDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Next billing date</span>
                <span>{formatOrderDate(nextBillingDate.toISOString())}</span>
              </div>
            )}
            {order.payment_details && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment method</span>
                <span>**** **** **** {order.payment_details.last4}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 