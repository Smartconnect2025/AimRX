import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface NotificationAction {
  label: string;
  action: () => void;
}

export interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    time: string;
    read: boolean;
    critical: boolean;
    icon: LucideIcon;
    actions: NotificationAction[];
  };
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const {
    title,
    body,
    time,
    read,
    critical,
    icon: Icon,
    actions,
  } = notification;

  return (
    <Card className={`mb-1.5 p-2 ${read ? "bg-card" : "bg-muted/30"}`}>
      <div className="flex items-start gap-2">
        <div
          className={`rounded-full p-1.5 ${critical ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h4
              className={`text-xs font-medium truncate ${!read ? "font-semibold text-primary" : ""}`}
            >
              {title}
            </h4>
            {critical && (
              <Badge variant="destructive" className="h-4 px-1 text-[0.65rem]">
                Alert
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {body}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[0.65rem] text-muted-foreground">{time}</span>
            <div className="flex gap-1">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[0.65rem]"
                  onClick={action.action}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
