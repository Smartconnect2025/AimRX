"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { SyncOrderConfirmation } from "@/features/orders/components/SyncOrderConfirmation";

export function OrderConfirmation() {
  const router = useRouter();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderType, setPendingOrderType] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a pending sync order
    const orderId = localStorage.getItem("pendingOrderId");
    const orderType = localStorage.getItem("pendingOrderType");

    if (orderId && orderType) {
      setPendingOrderId(orderId);
      setPendingOrderType(orderType);
    }
  }, []);

  const handleScheduleAppointment = () => {
    // Navigate to provider search where patient can book appointment
    // Store order context for linking after appointment is created
    sessionStorage.setItem("pendingOrderId", pendingOrderId || "");
    sessionStorage.setItem("pendingOrderType", pendingOrderType || "");
    router.push("/provider-search");
  };

  const handleViewOrderDetails = () => {
    router.push("/orders");
  };

  // Show sync order confirmation if there's a pending sync order
  if (pendingOrderId && pendingOrderType) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Order confirmed section */}
        <Card className="p-8 text-center border-gray-100">
          <div className="flex flex-col items-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
          </div>
        </Card>

        {/* Sync order appointment scheduling */}
        <SyncOrderConfirmation
          orderType={pendingOrderType}
          orderId={pendingOrderId}
          onScheduleAppointment={handleScheduleAppointment}
          onViewOrderDetails={handleViewOrderDetails}
        />
      </div>
    );
  }

  // Show regular async order confirmation
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="p-8 text-center border-gray-100">
        <div className="flex flex-col items-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold mb-6">Order Confirmed!</h1>

          <div className="space-y-4 w-full max-w-sm">
            <Button
              variant="default"
              className="w-full"
              onClick={() => router.push("/orders")}
            >
              View My Orders
            </Button>
            <Button
              variant="outline"
              className="w-full border-gray-100 shadow-sm"
              onClick={() => router.push("/catalog")}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
