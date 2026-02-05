import {
  Activity,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Package,
  Target,
  Bell,
} from "lucide-react";
import type { Notification } from "../services/notificationService";

// Icon mapping for notification types
const getIconForNotificationType = (type: string) => {
  switch (type) {
    case "vital":
      return Activity;
    case "symptom":
      return AlertTriangle;
    case "appointment":
      return Calendar;
    case "chat":
      return MessageSquare;
    case "order":
      return Package;
    case "goal":
      return Target;
    default:
      return Bell;
  }
};

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
};

// Transform database notification to UI format for NotificationItem
export const transformNotificationForUI = (notification: Notification) => {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    time: formatTimeAgo(notification.createdAt),
    read: notification.read,
    critical: notification.critical,
    icon: getIconForNotificationType(notification.type),
    actions: notification.actions.map((action) => ({
      label: action.label,
      action: () => {
        // Stub action - these will be implemented later
      },
    })),
  };
};
