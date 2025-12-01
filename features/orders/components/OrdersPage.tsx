"use client";

import { useOrders } from "../hooks/useOrders";
import { OrderTable } from "./OrderTable";
import { OrderCard } from "./OrderCard";
import { ORDER_MESSAGES } from "../constants";

export function OrdersPage() {
  const { orders, isLoading, totalOrders } = useOrders();

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="px-4 py-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-gray-500 mt-2">
              Track your orders and manage your subscriptions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            {ORDER_MESSAGES.LOADING}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-4 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-500 mt-2">
            Track your orders and manage your subscriptions
          </p>
          {totalOrders > 0 && (
            <div className="text-sm text-gray-600 mt-1">
              {totalOrders} order{totalOrders !== 1 ? "s" : ""} found
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <OrderTable orders={orders} />
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              {ORDER_MESSAGES.NO_ORDERS}
            </div>
          ) : (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      </div>
    </div>
  );
}
