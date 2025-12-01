"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PopoverClose } from "@/components/ui/popover";
import { NotificationItem } from "./NotificationItem";
import { useNotificationContext } from "../context/NotificationContext";
import { transformNotificationForUI } from "../utils/transformNotification";

export const NotificationPanelContent = () => {
  const [filter, setFilter] = useState("all");
  const { notifications, loading, markAllAsRead } = useNotificationContext();

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((notif) => notif.type === filter);

  return (
    <div className="flex flex-col h-[480px] rounded-lg overflow-hidden">
      <div className="p-2 border-b border-border">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <PopoverClose className="rounded-full h-6 w-6 flex items-center justify-center hover:bg-muted">
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close</span>
          </PopoverClose>
        </div>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => value && setFilter(value)}
          className="justify-start gap-1 w-full"
        >
          <ToggleGroupItem
            value="all"
            aria-label="All notifications"
            className="h-5 px-2 py-0 text-xs"
          >
            All
          </ToggleGroupItem>
          <ToggleGroupItem
            value="vital"
            aria-label="Vital notifications"
            className="h-5 px-2 py-0 text-xs"
          >
            Vital
          </ToggleGroupItem>
          <ToggleGroupItem
            value="symptom"
            aria-label="Symptom notifications"
            className="h-5 px-2 py-0 text-xs"
          >
            Symptoms
          </ToggleGroupItem>
          <ToggleGroupItem
            value="appointment"
            aria-label="Appointment notifications"
            className="h-5 px-2 py-0 text-xs"
          >
            Appts
          </ToggleGroupItem>
          <ToggleGroupItem
            value="chat"
            aria-label="Chat notifications"
            className="h-5 px-2 py-0 text-xs"
          >
            Chat
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ScrollArea className="flex-1 h-[320px]">
        <div className="p-2">
          {filteredNotifications.map((notification) => (
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
