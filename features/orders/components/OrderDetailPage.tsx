"use client";

import { useOrderDetail } from "../hooks/useOrderDetail";
import { BackButton } from "./BackButton";
import { OrderBreadcrumb } from "./OrderBreadcrumb";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { AddressesCard } from "./AddressesCard";
import { SubscriptionStatusCard } from "./SubscriptionStatusCard";
import { OrderItemsTable } from "./OrderItemsTable";
import { ActivityTimelineCard } from "./ActivityTimelineCard";
import { formatOrderDateTime, getLatestOrderStatus } from "../utils";
import { ORDER_MESSAGES } from "../constants";

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const { order, isLoading, error, notFound } = useOrderDetail(orderId);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="px-4 py-8 max-w-5xl mx-auto">
          <BackButton />
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            {ORDER_MESSAGES.LOADING}
          </div>
        </div>
      </div>
    );
  }

  if (error || notFound || !order) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="px-4 py-8 max-w-5xl mx-auto">
          <BackButton />
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-500">
            {error || ORDER_MESSAGES.ORDER_NOT_FOUND}
          </div>
        </div>
      </div>
    );
  }

  const latestStatus = getLatestOrderStatus(order);
  const orderDateTime = formatOrderDateTime(order.created_at);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-4 py-8 max-w-5xl mx-auto">
        <BackButton />
        <OrderBreadcrumb orderId={order.id} />

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.id}
              </h1>
              <p className="text-gray-500 mt-2">{orderDateTime}</p>
            </div>
            <OrderStatusBadge status={latestStatus} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <AddressesCard order={order} />
            <SubscriptionStatusCard order={order} />
            <OrderItemsTable order={order} />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="lg:col-span-1">
            <ActivityTimelineCard order={order} />
          </div>
        </div>
      </div>
    </div>
  );
}
