"use client";

/**
 * Order Review Hook
 * 
 * Hook for managing order review state and operations
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { OrderReviewData, OrderReviewState } from "../types";
import { 
  getOrderById, 
  startOrderReview, 
  releaseOrderReview, 
  completeOrderReview 
} from "../services/orderReviewService";

export function useOrderReview(orderId: string, providerId?: string) {
  const [state, setState] = useState<OrderReviewState>({
    isLoading: true,
    error: null,
    isStartingReview: false,
    isReleasingReview: false,
  });

  const [order, setOrder] = useState<OrderReviewData | null>(null);

  // Fetch order data
  const fetchOrder = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
      
      if (!orderData) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: "Order not found" 
        }));
        return;
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error("Error fetching order:", error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: "Failed to load order" 
      }));
    }
  }, [orderId]);

  // Start order review
  const handleStartReview = useCallback(async () => {
    if (!providerId || !order) return;

    setState(prev => ({ ...prev, isStartingReview: true, error: null }));

    try {
      const result = await startOrderReview(order.id, providerId);
      
      if (!result.success) {
        setState(prev => ({ 
          ...prev, 
          isStartingReview: false, 
          error: result.error || "Failed to start review" 
        }));
        toast.error(result.error || "Failed to start review");
        return;
      }

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        review_status: "in_review",
        reviewed_by: providerId
      } : null);

      setState(prev => ({ ...prev, isStartingReview: false }));
      toast.success("Review started successfully");
      
      // Scroll to questionnaire section
      setTimeout(() => {
        const element = document.getElementById("questionnaire-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
      
    } catch (error) {
      console.error("Error starting review:", error);
      setState(prev => ({ 
        ...prev, 
        isStartingReview: false, 
        error: "An unexpected error occurred" 
      }));
      toast.error("An unexpected error occurred");
    }
  }, [order, providerId]);

  // Release order review
  const handleReleaseReview = useCallback(async () => {
    if (!providerId || !order) return;

    setState(prev => ({ ...prev, isReleasingReview: true, error: null }));

    try {
      const result = await releaseOrderReview(order.id, providerId);
      
      if (!result.success) {
        setState(prev => ({ 
          ...prev, 
          isReleasingReview: false, 
          error: result.error || "Failed to release review" 
        }));
        toast.error(result.error || "Failed to release review");
        return;
      }

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        review_status: "pending",
        reviewed_by: undefined
      } : null);

      setState(prev => ({ ...prev, isReleasingReview: false }));
      toast.success("Review released successfully");
      
    } catch (error) {
      console.error("Error releasing review:", error);
      setState(prev => ({ 
        ...prev, 
        isReleasingReview: false, 
        error: "An unexpected error occurred" 
      }));
      toast.error("An unexpected error occurred");
    }
  }, [order, providerId]);

  // Complete order review
  const handleCompleteReview = useCallback(async () => {
    if (!providerId || !order) return;

    try {
      const result = await completeOrderReview(order.id, providerId);
      
      if (!result.success) {
        toast.error(result.error || "Failed to complete review");
        return;
      }

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        review_status: "completed",
        reviewed_at: new Date().toISOString()
      } : null);

      toast.success("Review completed successfully");
      
    } catch (error) {
      console.error("Error completing review:", error);
      toast.error("An unexpected error occurred");
    }
  }, [order, providerId]);

  // Check if current provider is reviewing this order
  const isBeingReviewedByCurrentProvider = order?.review_status === "in_review" && 
    order?.reviewed_by === providerId;

  return {
    order,
    state,
    fetchOrder,
    handleStartReview,
    handleReleaseReview,
    handleCompleteReview,
    isBeingReviewedByCurrentProvider,
  };
} 