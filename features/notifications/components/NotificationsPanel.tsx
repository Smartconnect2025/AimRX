import { NotificationBell } from "./NotificationBell";
import { NotificationPanelContent } from "./NotificationPanelContent";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationsPanel() {
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <NotificationBell />
        </PopoverTrigger>
        <PopoverContent
          className="w-[380px] p-0 rounded-lg border border-border"
          align="end"
        >
          <NotificationPanelContent />
        </PopoverContent>
      </Popover>
    </div>
  );
}
