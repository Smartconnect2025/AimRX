"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PopoverClose } from "@/components/ui/popover";
import { NotificationItem } from "./NotificationItem";
import { useNotificationContext } from "../context/NotificationContext";
import { transformNotificationForUI } from "../utils/transformNotification";

export const NotificationPanelContent = () => {
  const { notifications, loading, markAllAsRead } = useNotificationContext();

  return (
    <div className="flex flex-col h-[480px] rounded-lg overflow-hidden">
      <div className="p-2 border-b border-border">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <PopoverClose className="rounded-full h-6 w-6 flex items-center justify-center hover:bg-muted">
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </PopoverClose>
        </div>
      </div>

      <ScrollArea className="flex-1 h-[320px]">
        <div className="p-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={transformNotificationForUI(notification)}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border flex justify-start">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 text-xs px-2"
          onClick={markAllAsRead}
          disabled={loading}
        >
          {loading ? "Loading..." : "Mark all as read"}
        </Button>
      </div>
    </div>
  );
};
