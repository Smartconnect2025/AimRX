"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { Order } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface ActivityTimelineCardProps {
  order: Order;
}

export function ActivityTimelineCard({ order }: ActivityTimelineCardProps) {
  if (!order.activities || order.activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-sm">
            No activity recorded yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort activities by date (newest first)
  const sortedActivities = [...order.activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative ml-2">
          {sortedActivities.map((activity, index) => {
            // Parse the date string
            const activityDate = new Date(activity.date);
            const formattedDate = format(activityDate, "MM/dd/yyyy");
            const formattedTime = format(activityDate, "h:mma").toLowerCase();

            // Check if it's the last item to not show the connecting line
            const isLastItem = index === sortedActivities.length - 1;

            return (
              <div
                key={`${activity.status}-${activityDate.getTime()}`}
                className={`flex items-start relative ${
                  !isLastItem ? "mb-6" : ""
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-0 mt-1.5 w-3 h-3 bg-blue-600 rounded-full"></div>
                
                {/* Connecting line */}
                {!isLastItem && (
                  <div className="absolute left-1.5 top-6 w-[1px] h-full bg-gray-300"></div>
                )}
                
                {/* Content */}
                <div className="ml-8 flex-1">
                  <div className="flex flex-col gap-2">
                    <OrderStatusBadge status={activity.status} />
                    <div className="flex flex-col text-sm text-gray-600">
                      <span>{formattedDate}</span>
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 