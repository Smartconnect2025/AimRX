import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { ConnectedDevice } from "../../types/health";

interface DeviceManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: ConnectedDevice[];
  onDeleteDevice: (deviceId: string) => void;
  onAddDevice: () => void;
  isLinkReady?: boolean;
  hasLinkError?: boolean;
}

const formatConnectedDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const DeviceManagementModal = ({
  devices,
  onDeleteDevice,
  onAddDevice,
  isLinkReady = true,
  hasLinkError = false,
}: DeviceManagementModalProps) => {
  return (
    <DialogContent className="bg-white sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Manage Devices</DialogTitle>
        <DialogDescription>
          Manage your connected health devices and add new ones. We support
          popular wearables like Fitbit, Oura Ring, Apple Health, Garmin, and
          more.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No devices connected
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <Card key={device.deviceId}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{device.deviceName}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {device.deviceType.replace("_", " ")} • Connected on{" "}
                      {formatConnectedDate(new Date(device.lastSync))}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteDevice(device.deviceId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {hasLinkError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Device connection is temporarily unavailable. Please refresh the
              page and try again.
            </div>
          )}
          <Button
            onClick={onAddDevice}
            className="w-full"
            disabled={!isLinkReady || hasLinkError}
          >
            <Plus className="w-4 h-4 mr-2" />
            {!isLinkReady ? "Loading..." : "Add New Device"}
          </Button>
          {devices.length === 0 && !hasLinkError && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wearable devices to start tracking your health
              metrics.
            </p>
          )}
        </div>
      </div>
    </DialogContent>
  );
};
