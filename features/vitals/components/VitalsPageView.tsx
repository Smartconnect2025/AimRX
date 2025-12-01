"use client";

import { Dialog } from "@/components/ui/dialog";
import { useVitalLink } from "@tryvital/vital-link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HealthData, TimeRange } from "../types/health";
import { DeviceManagementModal } from "./vitals/DeviceManagementModal";
import { PageHeader } from "./vitals/PageHeader";
import { TabContent } from "./vitals/TabContent";
import { TabNavigation, VitalsTab } from "./vitals/TabNavigation";

const VitalsPageView = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [activeTab, setActiveTab] = useState<VitalsTab>("sleep");
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnectingDevice, setIsConnectingDevice] = useState(false);
  const router = useRouter();

  // Initialize Junction Link SDK
  const {
    open,
    ready,
    error: linkError,
  } = useVitalLink({
    env: "sandbox", // or "sandbox" for testing
    onSuccess: (metadata: Record<string, unknown>) => {
      console.log("Device connected successfully:", metadata);
      toast.success(
        `Successfully connected provider ${metadata["provider"] ?? "'unknown provider'"}!`,
      );
      setShowDeviceModal(false);
      // Refresh health data to show the new device
      const fetchHealthData = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/vitals/junction/health?timeRange=${timeRange}`,
          );
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || "Failed to fetch health data");
          }
          setHealthData(result.data);
        } catch (err) {
          console.error("Failed to refresh health data:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchHealthData();
    },
    onExit: (metadata: Record<string, unknown>) => {
      console.log("User exited link flow:", metadata);
      if (metadata?.provider) {
        toast.info(`Connection to ${metadata.provider} was cancelled.`);
      }
    },
    onError: (error: Record<string, unknown>) => {
      console.error("Link flow error:", error);
      toast.error("Failed to connect device. Please try again.");
    },
  });

  useEffect(() => {
    const fetchHealthData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/vitals/junction/health?timeRange=${timeRange}`,
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to fetch health data");
        }

        setHealthData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Failed to fetch health data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [timeRange]);

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const response = await fetch(
        `/api/vitals/junction/device?deviceId=${deviceId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to disconnect device");
      }

      // Filter out the device from local state
      const updatedDevices =
        healthData?.devices.filter((device) => device.deviceId !== deviceId) ||
        [];

      // If no devices left, navigate to null state
      if (updatedDevices.length === 0) {
        router.push("/vitals/null-state");
        return;
      }

      // Update health data with remaining devices
      if (healthData) {
        setHealthData({
          ...healthData,
          devices: updatedDevices,
        });
      }

      toast.success("Device disconnected successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect device",
      );
    }
  };

  const handleAddDevice = async () => {
    try {
      setIsConnectingDevice(true);

      // Check if the link SDK is ready
      if (!ready) {
        toast.error(
          "Device connection is not ready. Please try again in a moment.",
        );
        return;
      }

      // Check for any link errors
      if (linkError) {
        console.error("Link SDK error:", linkError);
        toast.error(
          "Device connection is not available. Please refresh and try again.",
        );
        return;
      }

      // Generate link token for device connection
      const response = await fetch("/api/vitals/junction/link-token", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: Failed to generate link token`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to generate link token");
      }

      if (!result.link_token) {
        throw new Error("No link token received from server");
      }

      // Open the Junction Link SDK with the generated token
      open(result.link_token);
    } catch (err) {
      console.error("Failed to initiate device connection:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to initiate device connection",
      );
    } finally {
      setIsConnectingDevice(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 pb-8 pt-20">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading health data...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 pb-8 pt-20">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading health data</p>
            <p className="text-gray-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!healthData) {
    return (
      <main className="flex-1 pb-8 pt-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pb-8 pt-20">
      <div className="container mx-auto px-4">
        <Dialog>
          <PageHeader
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onManageDevices={() => setShowDeviceModal(true)}
          />

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <TabContent
            activeTab={activeTab}
            timeRange={timeRange}
            healthData={healthData}
          />

          <DeviceManagementModal
            open={showDeviceModal}
            onOpenChange={setShowDeviceModal}
            devices={healthData.devices}
            onDeleteDevice={handleDeleteDevice}
            onAddDevice={handleAddDevice}
            isLinkReady={ready && !isConnectingDevice}
            hasLinkError={!!linkError}
          />
        </Dialog>
      </div>
    </main>
  );
};

export default VitalsPageView;
