"use client";

import type { Activity } from "../types";
import { formatOrderDateTime } from "../utils";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No activity history available
      </div>
    );
  }

  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedActivities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3">
          <div className="relative flex-shrink-0">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full" />
            </div>
            {index !== sortedActivities.length - 1 && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-px h-6 bg-gray-300" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <OrderStatusBadge status={activity.status} />
              <div className="text-sm text-gray-500">
                {formatOrderDateTime(activity.date)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 