"use client";

/**
 * Order Review Controls Component
 * 
 * Displays review controls and status for order review workflow
 */

import { Button } from "@/components/ui/button";
import { OrderReviewData } from "../types";
import { REVIEW_STATUS_LABELS } from "../constants";
import { cn } from "@/utils/tailwind-utils";

interface OrderReviewControlsProps {
  order: OrderReviewData;
  isStartingReview: boolean;
  isReleasingReview: boolean;
  isBeingReviewedByCurrentProvider: boolean;
  onStartReview: () => void;
  onReleaseReview: () => void;
}

export function OrderReviewControls({
  order,
  isStartingReview,
  isReleasingReview,
  isBeingReviewedByCurrentProvider,
  onStartReview,
  onReleaseReview,
}: OrderReviewControlsProps) {
  // Determine the display state
  const getControlsConfig = () => {
    switch (order.review_status) {
      case "pending":
        return {
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800",
          message: "Order available for review",
          action: (
            <Button 
              onClick={onStartReview}
              disabled={isStartingReview}
            >
              {isStartingReview ? "Starting..." : "Start Review"}
            </Button>
          )
        };
      
      case "in_review":
        if (isBeingReviewedByCurrentProvider) {
          return {
            bgColor: "bg-blue-50 border-blue-200",
            textColor: "text-blue-800",
            message: "You are currently reviewing this order",
            action: (
              <Button 
                variant="outline"
                onClick={onReleaseReview}
                disabled={isReleasingReview}
              >
                {isReleasingReview ? "Releasing..." : "Release Review"}
              </Button>
            )
          };
        } else {
          return {
            bgColor: "bg-orange-50 border-orange-200",
            textColor: "text-orange-800",
            message: "This order is currently being reviewed by another provider",
            action: null
          };
        }
      
      case "completed":
        return {
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-800",
          message: "This order has been completed",
          action: null
        };
      
      default:
        return {
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-800",
          message: `Status: ${REVIEW_STATUS_LABELS[order.review_status] || order.review_status}`,
          action: null
        };
    }
  };

  const config = getControlsConfig();

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border mb-6",
      config.bgColor
    )}>
      <div className="flex items-center">
        <div className={cn("w-3 h-3 rounded-full mr-3", 
          order.review_status === "pending" ? "bg-green-500" :
          order.review_status === "in_review" ? "bg-blue-500" :
          order.review_status === "completed" ? "bg-gray-500" : "bg-gray-400"
        )} />
        <span className={cn("font-medium", config.textColor)}>
          {config.message}
        </span>
      </div>
      
      {config.action && (
        <div className="flex items-center space-x-2">
          {config.action}
        </div>
      )}
    </div>
  );
} 