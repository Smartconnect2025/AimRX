"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Order } from "../types";
import { getStoredOrders, saveOrdersToStorage } from "../utils";

interface CancelSubscriptionDialogProps {
  order: Order;
  className?: string;
}

export function CancelSubscriptionDialog({
  order,
  className,
}: CancelSubscriptionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(
    order.payment_details?.requested_cancel || false,
  );

  // Calculate next billing date (30 days from order date)
  const nextBillingDate = new Date(order.created_at);
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update localStorage to reflect cancellation request
      const orders = getStoredOrders();
      const updatedOrders = orders.map((o: Order) => {
        if (o.id === order.id) {
          return {
            ...o,
            payment_details: o.payment_details
              ? {
                  ...o.payment_details,
                  requested_cancel: true,
                }
              : undefined,
          };
        }
        return o;
      });
      saveOrdersToStorage(updatedOrders);

      // Trigger custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent("orders-updated"));

      setHasRequested(true);
      toast.success("Cancellation request submitted successfully");
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error(
        "Failed to cancel subscription. Please try again or contact support.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Check if cancellation is within 14 days of next billing
  const isWithin14Days =
    nextBillingDate.getTime() - new Date().getTime() <=
    14 * 24 * 60 * 60 * 1000;

  if (hasRequested) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className={className} disabled>
          Cancellation Requested
        </Button>
        <span className="text-xs text-muted-foreground">
          Your cancellation request is being processed
        </span>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className={className}>
          Cancel Subscription
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Your Subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your subscription? This action
            cannot be undone.
          </AlertDialogDescription>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="font-medium">
              {isWithin14Days
                ? "As per our policy, you will still be charged for and receive one final order since cancellation is within 14 days of your next billing cycle."
                : "Your subscription will be canceled immediately."}
            </div>
            <div className="text-gray-600">
              Next billing date: {nextBillingDate.toLocaleDateString()}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Nevermind</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelSubscription}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Yes, Cancel Subscription"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
