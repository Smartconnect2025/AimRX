import React from "react";
import { Bell } from "lucide-react";
import { useNotificationContext } from "../context/NotificationContext";

export const NotificationBell = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  // Use the context to get the shared unread count
  const { unreadCount } = useNotificationContext();

  return (
    <div className="relative">
      <button
        ref={ref}
        {...props}
        className="relative h-10 w-10 p-0 flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:text-foreground rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        <span className="sr-only">Notifications</span>
      </button>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border-2 border-background">
          {unreadCount}
        </span>
      )}
    </div>
  );
});

NotificationBell.displayName = "NotificationBell";
