"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/core/auth";
import { useOrderReview } from "./hooks/useOrderReview";
import { OrderReviewHeader } from "./components/OrderReviewHeader";
import { OrderReviewControls } from "./components/OrderReviewControls";
import { QuestionnaireDisplay } from "./components/QuestionnaireDisplay";
import { OrderDetailsCard } from "./components/OrderDetailsCard";
import { isValidOrderId } from "./utils";
import { Button } from "@/components/ui/button";

interface ProviderOrderReviewPageProps {
  orderId: string;
}

export function ProviderOrderReviewPage({
  orderId,
}: ProviderOrderReviewPageProps) {
  const router = useRouter();
  const { user, userRole } = useUser();

  const {
    order,
    state,
    fetchOrder,
    handleStartReview,
    handleReleaseReview,
    handleCompleteReview,
    isBeingReviewedByCurrentProvider,
  } = useOrderReview(orderId, user?.id);

  useEffect(() => {
    if (!isValidOrderId(orderId)) {
      router.push("/provider/orders");
      return;
    }
  }, [orderId, router]);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (userRole !== "provider") {
      router.push("/");
      return;
    }
  }, [user, userRole, router]);

  useEffect(() => {
    if (user?.id && userRole === "provider") {
      fetchOrder();
    }
  }, [user?.id, userRole, fetchOrder]);

  if (state.isLoading) {
    return (
      <div className="flex-1 bg-background">
        <div className="container mx-auto px-4 pb-16">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.error || !order) {
    return (
      <div className="flex-1 bg-background">
        <div className="container mx-auto px-4 pb-16">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {state.error || "Order not found"}
              </h2>
              <Button
                onClick={() => router.push("/provider/orders")}
                variant="default"
                className="px-4 py-2 rounded-md"
              >
                Back to Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (order.shipping_address.state !== "AZ") {
    return (
      <div className="flex-1 bg-background">
        <div className="container mx-auto px-4 pb-16">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unauthorized Access
              </h2>
              <p className="text-gray-600 mb-4">
                You can only review orders from your licensed state (Arizona).
              </p>
              <Button
                onClick={() => router.push("/provider/orders")}
                variant="default"
                className="px-4 py-2 rounded-md"
              >
                Back to Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <div className="container mx-auto px-4 pb-16 relative">
        <OrderReviewHeader order={order} />

        <OrderReviewControls
          order={order}
          isStartingReview={state.isStartingReview}
          isReleasingReview={state.isReleasingReview}
          isBeingReviewedByCurrentProvider={isBeingReviewedByCurrentProvider}
          onStartReview={handleStartReview}
          onReleaseReview={handleReleaseReview}
        />

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-800 font-medium">{state.error}</span>
            </div>
          </div>
        )}

        <QuestionnaireDisplay questionnaireData={order.questionnaire_data} />

        <OrderDetailsCard order={order} />

        {isBeingReviewedByCurrentProvider && (
          <div className="bg-white rounded-lg shadow-sm border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Prescription Management
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 mb-4">
                Review the patient&apos;s questionnaire responses above and
                proceed with prescription if appropriate.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleCompleteReview}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Complete Review
                </button>
                <Button
                  onClick={handleReleaseReview}
                  disabled={state.isReleasingReview}
                  variant="secondary"
                  className="px-4 py-2 rounded-md"
                >
                  {state.isReleasingReview ? "Releasing..." : "Release Review"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
