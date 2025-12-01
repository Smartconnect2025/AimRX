"use client";

import {
  JunctionOrder,
  JunctionOrdersResponse,
} from "@/app/api/labs/junction/orders/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppointmentConfirmation } from "./components/AppointmentConfirmation";
import { LabCard } from "./components/LabCard";
import { LocationDetailsDialog } from "./components/LocationDetailsDialog";
import { OrderCard } from "./components/OrderCard";
import RecentResultsSection from "./components/RecentResultsSection";
import { ScheduleDialog } from "./components/ScheduleDialog";
import {
  JunctionLabData,
  JunctionLabTestItem,
  JunctionLabTestsResponse,
} from "./services/junctionLabData";
import { LabAppointment, LabPanel } from "./types/lab";
import { convertJunctionToLabResult } from "./utils/panelMapping";

// Filter orders that are ready for scheduling
const isOrderSchedulable = (order: JunctionOrder): boolean => {
  // Order must be in collecting_sample status
  if (order.id === "0ca90a3b-bb19-4a9f-ac7d-aff8835fb73f") {
    console.log("Cancelled order", order);
  }
  const mostRecentStatus = order.events[order.events.length - 1]?.status;
  if (!mostRecentStatus) {
    return false;
  }

  const validStatuses: (typeof order)["events"][number]["status"][] = [
    "received.at_home_phlebotomy.requisition_created",
    "collecting_sample.at_home_phlebotomy.appointment_cancelled",
    // TODO: TRS - for some reason, no labs seem to be compatible with walk-in tests.
    /**
     * I tried scheduling a number of them and all of them came back with the following response:
     * POST {VITAL_URL}/v3/order/:order_id/psc/appointment/book
     * { "detail": "This lab is not supported." }
     */
    // "received.walk_in_test.requisition_created",
  ];

  return validStatuses.includes(mostRecentStatus);
};

// Filter orders that have scheduled appointments
const isOrderScheduled = (order: JunctionOrder): boolean => {
  const mostRecentStatus = order.events[order.events.length - 1]?.status;
  return (
    mostRecentStatus ===
    "collecting_sample.at_home_phlebotomy.appointment_scheduled"
  );
};

// Convert Vital lab test to LabPanel format for compatibility
const convertJunctionLabTestResponseTestToLabPanel = (
  junctionTest: JunctionLabTestItem,
): LabPanel => {
  return {
    id: junctionTest.id,
    name: junctionTest.name,
    slug: junctionTest.slug,
    // Handle null markers and provide better descriptions
    description:
      junctionTest.markers && junctionTest.markers.length > 0
        ? junctionTest.markers.map((marker) => marker.name).join(", ")
        : `${junctionTest.sample_type} test via ${junctionTest.method}`,
    biomarkers: junctionTest.markers?.map((marker) => marker.name) || [],
    price: junctionTest.price || 0,
    // TODO: TRS - field does not exist on Junction, using a placeholder
    estimatedTime: "30-45 minutes",
    fastingRequired: junctionTest.fasting || false,
    // TODO: TRS - field does not exist on Junction, using a placeholder
    urgency: "normal" as const,
    // TODO: TRS - I don't see any kind of purchase capability on Junction's docs...
    // so I am not sure what we're expecting to do here
    purchaseDate: new Date().toISOString(),
    // TODO: TRS - field does not exist on Junction, using a placeholder of 1 year from now
    expirationDate: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    // TODO: TRS - field does not exist on Junction, using a placeholder
    timeSensitive: false, // Placeholder since not available in Vital API
  };
};

const LabsView = () => {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<LabPanel | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<LabAppointment | null>(null);
  const [locationDetailsOpen, setLocationDetailsOpen] = useState(false);
  // const [selectedLocationName, setSelectedLocationName] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Lab data state
  const [labData, setLabData] = useState<JunctionLabData | null>(null);
  const [isLoadingLabData, setIsLoadingLabData] = useState(true);
  const [labDataError, setLabDataError] = useState<string | null>(null);

  // Lab tests state
  const [labTests, setLabTests] = useState<LabPanel[]>([]);
  const [isLoadingLabTests, setIsLoadingLabTests] = useState(true);

  // Orders state
  const [allOrders, setAllOrders] = useState<JunctionOrder[]>([]);

  // Fetch lab data from API
  const fetchLabData = async () => {
    try {
      setIsLoadingLabData(true);
      setLabDataError(null);

      // First, fetch order IDs from Junction API
      const ordersResponse = await fetch("/api/labs/junction/orders");

      if (!ordersResponse.ok) {
        if (ordersResponse.status === 401) {
          throw new Error("Please log in to view your lab results");
        } else {
          throw new Error(
            `Failed to fetch lab orders: ${ordersResponse.statusText}`,
          );
        }
      }

      const ordersData: JunctionOrdersResponse = await ordersResponse.json();

      // Store all orders for scheduling functionality
      setAllOrders(ordersData.orders);

      // Filter only completed orders for fetching results
      const completedOrders = ordersData.orders.filter(
        (order) => order.status === "completed",
      );
      const completedOrderIds = completedOrders.map((order) => order.id);

      // If no completed orders found, set empty lab data
      if (completedOrderIds.length === 0) {
        setLabData({
          user_id: "",
          lab_results: [],
        });
        return;
      }

      // Fetch lab results using only completed order IDs
      const orderIdsParam = completedOrderIds.join(",");
      const response = await fetch(
        `/api/labs/junction/results?order_ids=${orderIdsParam}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view your lab results");
        }
        throw new Error(`Failed to fetch lab results: ${response.statusText}`);
      }

      const data: JunctionLabData = await response.json();
      setLabData(data);
    } catch (err) {
      console.error("Error fetching lab data:", err);
      setLabDataError(
        err instanceof Error ? err.message : "Failed to load lab results",
      );
    } finally {
      setIsLoadingLabData(false);
    }
  };

  // Fetch available lab tests from Vital API
  const fetchLabTests = async () => {
    try {
      setIsLoadingLabTests(true);

      const response = await fetch("/api/labs/junction/lab_test");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view available tests");
        } else {
          throw new Error(`Failed to fetch lab tests: ${response.statusText}`);
        }
      }

      const data: JunctionLabTestsResponse = await response.json();

      // Convert Vital tests to LabPanel format and combine with any existing mock data
      console.log("Lab Tests:", data);
      const convertedTests = data.data
        .filter((testData: JunctionLabTestItem) => testData.is_active) // Only show active tests
        .map(convertJunctionLabTestResponseTestToLabPanel);

      // If we have real data, use it; otherwise fallback to mock data
      setLabTests(convertedTests);
    } catch (err) {
      console.error("Error fetching lab tests:", err);
      // Fallback to mock data on error
      setLabTests([]);
    } finally {
      setIsLoadingLabTests(false);
    }
  };

  useEffect(() => {
    fetchLabData();
    fetchLabTests();
  }, []);

  // Get orders that are ready for scheduling
  // const schedulableOrders = allOrders;
  const schedulableOrders = allOrders.filter(isOrderSchedulable);

  // Get orders that have scheduled appointments
  const scheduledOrders = allOrders.filter(isOrderScheduled);

  console.log("Schedulable Order Data", schedulableOrders);
  console.log("Scheduled Order Data", scheduledOrders);

  // Convert scheduled orders to appointments for the UI
  const scheduledAppointments: LabAppointment[] = scheduledOrders.map(
    (order) => {
      // Find the scheduled event to get appointment details if available
      const scheduledEvent = order.events.find(
        (event) =>
          event.status ===
          "collecting_sample.at_home_phlebotomy.appointment_scheduled",
      );

      return {
        id: order.id,
        panelId: order.id,
        panelName: order.lab_test?.name || `Order #${order.id.slice(-6)}`,
        // For now, use a placeholder date - in a real implementation, this would come from the appointment data
        scheduledDate: new Date(scheduledEvent?.created_at || order.updated_at),
        status: "scheduled" as const,
        location: "At-Home Phlebotomy",
        address: `${order.patient_address.first_line}, ${order.patient_address.city}, ${order.patient_address.state} ${order.patient_address.zip}`,
      };
    },
  );

  // Use only scheduled appointments from orders
  const allAppointments = scheduledAppointments;

  const handleSchedule = (panelId: string) => {
    const panel = labTests.find((p) => p.id === panelId);
    setSelectedPanel(panel || null);
    setScheduleDialogOpen(true);
  };

  const handleScheduleOrder = (orderId: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;

    // Convert order to LabPanel format for scheduling dialog
    const orderAsPanel: LabPanel = {
      id: order.id,
      name: order.lab_test?.name || `Order #${order.id.slice(-6)}`,
      description: order.lab_test
        ? `${order.lab_test.method.replace(/_/g, " ")} - ${order.lab_test.sample_type}`
        : "Lab test appointment",
      biomarkers: [],
      price: order.lab_test?.price || 0,
      estimatedTime: "30-45 minutes",
      fastingRequired: order.lab_test?.fasting || false,
      urgency: "normal" as const,
      purchaseDate: order.created_at,
      expirationDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      timeSensitive: false,
    };

    setSelectedPanel(orderAsPanel);
    setScheduleDialogOpen(true);
  };

  const handleAppointmentScheduled = (appointmentDetails: LabAppointment) => {
    // When a new appointment is scheduled, refresh the order data to show it
    fetchLabData();
    setConfirmedAppointment(appointmentDetails);
    setConfirmationOpen(true);
  };

  const canReschedule = (scheduledDate: Date) => {
    const now = new Date();
    const hoursDifference =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference > 24;
  };

  // TODO: TRS - implement rescheduling. For now user can just cancel and schedule again.
  // const handleReschedule = (appointmentId: string) => {
  //   const appointment = allAppointments.find((apt) => apt.id === appointmentId);
  //   if (!appointment) return;

  //   if (!canReschedule(appointment.scheduledDate)) {
  //     toast("Cannot Reschedule", {
  //       description:
  //         "Appointments can only be rescheduled up to 24 hours in advance.",
  //     });
  //     return;
  //   }

  //   // Find the corresponding panel for rescheduling
  //   const panel = labTests.find((p) => p.name === appointment.panelName);
  //   setSelectedPanel(panel || null);
  //   setScheduleDialogOpen(true);

  //   // The appointment will be updated when order data refreshes after rescheduling
  // };

  const handleCancelClick = (appointmentId: string) => {
    setAppointmentToCancel(appointmentId);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      // Check if this is a scheduled order appointment (not a mock appointment)
      const isScheduledOrder = scheduledOrders.some(
        (order) => order.id === appointmentToCancel,
      );

      if (isScheduledOrder) {
        // Cancel via Junction API
        const response = await fetch(`/api/labs/junction/appointment/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: appointmentToCancel,
            // TODO: TRS - This is a hardcoded value, we should allow the user to select from a list of reasons
            cancellationReasonId: "5c0257ef-6fea-4a22-b20a-3ddab573d5c9",
          }),
        });

        if (!response.ok) {
          const responseError = await response.json();
          const msg =
            "Failed to cancel appointment: " + JSON.stringify(responseError);
          console.error(msg);
          throw new Error(msg);
        }

        // Refresh order data to reflect the cancellation
        await fetchLabData();
      }

      toast("Appointment Cancelled", {
        description: "Your appointment has been successfully cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast("Error", {
        description: "Failed to cancel appointment. Please try again.",
      });
    } finally {
      setIsCancelling(false);
      setCancelConfirmOpen(false);
      setAppointmentToCancel("");
    }
  };

  const handleLocationClick = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      window.open(`http://maps.apple.com/?q=${encodedAddress}`, "_blank");
    } else if (isAndroid) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank",
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank",
      );
    }
  };

  // const handleLocationDetails = (locationName: string) => {
  //   setSelectedLocationName(locationName);
  //   setLocationDetailsOpen(true);
  // };

  return (
    <div className="min-h-screen bg-background">
      <main className="bg-muted min-h-[calc(100vh-80px)] p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to your Lab Dashboard
            </h1>
          </div>

          {/* Recent Results Section */}
          {isLoadingLabData ? (
            <Card className="border-0 rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading lab results...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : labDataError ? (
            <Card className="border-0 rounded-2xl">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{labDataError}</p>
                  <Button onClick={fetchLabData} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <RecentResultsSection
              labResults={
                labData?.lab_results.map(convertJunctionToLabResult) || []
              }
            />
          )}

          {/* Upcoming Appointments */}
          {allAppointments.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Upcoming Appointments
                </h2>
                <Badge variant="outline" className="text-xs">
                  {allAppointments.length} appointment
                  {allAppointments.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {allAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="h-full border-0 rounded-2xl"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg leading-tight">
                        {appointment.panelName}
                      </CardTitle>
                      <Badge variant="outline" className="w-fit capitalize">
                        {appointment.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>
                            {appointment.scheduledDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>
                            {appointment.scheduledDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span
                            className="hover:underline cursor-pointer"
                            onClick={() =>
                              handleLocationClick(appointment.address)
                            }
                          >
                            {appointment.location}
                          </span>
                        </div>
                      </div>

                      {/* Management Actions */}
                      <div className="flex flex-col gap-3">
                        <div className="flex">
                          {/* TODO: TRS - implement rescheduling. For now user can just cancel and schedule again */}
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(appointment.id)}
                            disabled={!canReschedule(appointment.scheduledDate)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                            Reschedule
                          </Button> */}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(appointment.id)}
                            className="flex items-center gap-1 text-xs w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>

                        {!canReschedule(appointment.scheduledDate) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Cannot reschedule within 24 hours
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Available Tests */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                Available Tests
              </h2>
            </div>
            {isLoadingLabTests ? (
              <Card className="border-0 rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading available tests...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {labTests.map((panel) => (
                  <LabCard
                    key={panel.id}
                    panel={panel}
                    onSchedule={handleSchedule}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Orders Ready for Scheduling */}
          {schedulableOrders.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Orders Ready for Scheduling
                </h2>
                <Badge variant="outline" className="text-xs">
                  {schedulableOrders.length} order
                  {schedulableOrders.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {schedulableOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onSchedule={handleScheduleOrder}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <ScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          panel={selectedPanel}
          onAppointmentScheduled={handleAppointmentScheduled}
        />

        <AppointmentConfirmation
          open={confirmationOpen}
          onOpenChange={setConfirmationOpen}
          appointment={confirmedAppointment}
          panel={selectedPanel}
        />

        <LocationDetailsDialog
          open={locationDetailsOpen}
          onOpenChange={setLocationDetailsOpen}
          // FIXME: TRS - I don't know why this was not set anywhere in the lovable component.
          // Maybe it's vestigial...?
          locationName={""}
        />

        {/* Cancel Confirmation Dialog */}
        <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
          <DialogContent className="w-full sm:max-w-lg min-w-1/4">
            <DialogHeader>
              <DialogTitle>Cancel Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this appointment? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCancelConfirmOpen(false)}
                disabled={isCancelling}
              >
                Keep Appointment
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Appointment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LabsView;
