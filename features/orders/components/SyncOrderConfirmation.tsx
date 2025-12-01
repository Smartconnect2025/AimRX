"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle } from "lucide-react";
import { getOrderTypeConfig } from "@/features/basic-emr/config/order-types";

interface SyncOrderConfirmationProps {
  orderType: string;
  orderId: string;
  onScheduleAppointment: () => void;
  onViewOrderDetails: () => void;
  className?: string;
}

export function SyncOrderConfirmation({
  orderType,
  orderId: _orderId,
  onScheduleAppointment,
  onViewOrderDetails: _onViewOrderDetails,
  className,
}: SyncOrderConfirmationProps) {
  const orderConfig = getOrderTypeConfig(orderType);
  const requiresAppointment = orderConfig?.requiresAppointment || false;

  if (!requiresAppointment) {
    return null; // Don't show for async orders
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between p-4">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Appointment Required
          </CardTitle>
          <Button onClick={onScheduleAppointment} size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Appointment
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
