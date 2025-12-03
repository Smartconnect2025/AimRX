"use client";

import { useState, useEffect, useCallback } from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pill, Eye, RefreshCw, CheckCircle2, FileText, UserPlus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@core/supabase";
import { useUser } from "@core/auth";
import { toast } from "sonner";

interface Prescription {
  id: string;
  queueId: string;
  dateTime: string;
  patientName: string;
  medication: string;
  strength: string;
  quantity: number;
  refills: number;
  status: string;
  sig: string;
  form: string;
  dispenseAsWritten: boolean;
  pharmacyNotes?: string;
  trackingNumber?: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "submitted":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "billing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "packed":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Status progression order
const STATUS_ORDER = ["Submitted", "Billing", "Approved", "Packed", "Shipped", "Delivered"];

// Generate fake tracking number
const generateTrackingNumber = () => {
  const prefix = "1Z";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let tracking = prefix;
  for (let i = 0; i < 16; i++) {
    tracking += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tracking;
};

// Move status forward
const advanceStatus = (currentStatus: string): { status: string; trackingNumber?: string } => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === STATUS_ORDER.length - 1) {
    return { status: currentStatus };
  }

  const newStatus = STATUS_ORDER[currentIndex + 1];
  const result: { status: string; trackingNumber?: string } = { status: newStatus };

  // Add tracking number when shipped
  if (newStatus === "Shipped") {
    result.trackingNumber = generateTrackingNumber();
  }

  return result;
};

export default function PrescriptionsPage() {
  const supabase = createClient();
  const { user } = useUser();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"in-progress" | "completed">("in-progress");

  // Load prescriptions from Supabase with real-time updates
  const loadPrescriptions = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        queue_id,
        submitted_at,
        medication,
        dosage,
        quantity,
        refills,
        sig,
        status,
        tracking_number,
        patient:patients(first_name, last_name)
      `)
      .eq("prescriber_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error loading prescriptions:", error);
      return;
    }

    if (data) {
      const formatted = data.map((rx) => {
        const patient = Array.isArray(rx.patient) ? rx.patient[0] : rx.patient;
        return {
          id: rx.id,
          queueId: rx.queue_id || "N/A",
          dateTime: rx.submitted_at,
          patientName: patient
            ? `${patient.first_name} ${patient.last_name}`
            : "Unknown Patient",
          medication: rx.medication,
          strength: rx.dosage,
          quantity: rx.quantity,
          refills: rx.refills,
          sig: rx.sig,
          status: rx.status || "submitted",
          trackingNumber: rx.tracking_number,
          form: "Tablet", // Default for now, should be added to schema
          dispenseAsWritten: false, // Default for now, should be added to schema
          pharmacyNotes: undefined,
        };
      });

      setPrescriptions(formatted);
      console.log("Loaded prescriptions from Supabase:", formatted.length);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    loadPrescriptions();

    // Set up real-time subscription for prescription changes
    const channel = supabase
      .channel("prescriptions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prescriptions",
          filter: `prescriber_id=eq.${user?.id}`,
        },
        () => {
          loadPrescriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPrescriptions, supabase, user?.id]);

  // Auto-refresh: Update 1-2 random prescriptions every 30 seconds
  const simulateStatusUpdates = useCallback(() => {
    setPrescriptions((prev) => {
      const updatedPrescriptions = [...prev];

      // Find prescriptions that can be advanced (not already Delivered)
      const advanceablePrescriptions = updatedPrescriptions
        .map((p, index) => ({ prescription: p, index }))
        .filter(({ prescription }) => prescription.status !== "Delivered");

      if (advanceablePrescriptions.length === 0) return prev;

      // Randomly select 1-2 prescriptions to advance
      const numToUpdate = Math.min(
        Math.floor(Math.random() * 2) + 1,
        advanceablePrescriptions.length
      );

      const shuffled = [...advanceablePrescriptions].sort(() => Math.random() - 0.5);
      const toUpdate = shuffled.slice(0, numToUpdate);

      toUpdate.forEach(({ index }) => {
        const current = updatedPrescriptions[index];
        const { status, trackingNumber } = advanceStatus(current.status);
        updatedPrescriptions[index] = {
          ...current,
          status,
          ...(trackingNumber && { trackingNumber }),
        };
      });

      // Update localStorage for submitted prescriptions
      const submittedPrescriptions = updatedPrescriptions.filter(p => p.id.startsWith("submitted_"));
      if (submittedPrescriptions.length > 0) {
        localStorage.setItem("submittedPrescriptions", JSON.stringify(submittedPrescriptions));
      }

      return updatedPrescriptions;
    });

    setSecondsSinceRefresh(0);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    simulateStatusUpdates();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Statuses updated", {
        icon: <CheckCircle2 className="h-5 w-5" />,
        duration: 3000,
      });
    }, 500);
  };

  // Timer: Update "X seconds ago" every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceRefresh((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      simulateStatusUpdates();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [simulateStatusUpdates]);

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsDialogOpen(true);
  };

  const formatTimeSinceRefresh = (seconds: number) => {
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  };

  // Filter prescriptions based on active tab
  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (activeTab === "in-progress") {
      return rx.status.toLowerCase() !== "delivered";
    } else {
      return rx.status.toLowerCase() === "delivered";
    }
  });

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Prescriptions
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage and track all e-prescriptions
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Test success toast
                  toast.success("Prescription submitted successfully!", {
                    description: "Queue ID: RX-TEST-12345",
                    duration: 6000,
                    icon: <CheckCircle2 className="h-5 w-5" />,
                  });

                  // Test error toast
                  setTimeout(() => {
                    toast.error("Submission failed", {
                      description: "Patient data missing - please try again",
                      duration: 6000,
                    });
                  }, 500);

                  // Console log for verification
                  setTimeout(() => {
                    const successToast = document.querySelector('[data-sonner-toast]');
                    console.log("TOAST TEST: Success toast visible = " + (successToast ? "YES" : "NO"));
                  }, 100);
                }}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-300"
              >
                TEST TOASTS
              </Button>
              <Link href="/prescriptions/new/step1">
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-5 w-5" />
                  New Prescription
                </Button>
              </Link>
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-sm text-muted-foreground">
            Last updated {formatTimeSinceRefresh(secondsSinceRefresh)}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("in-progress")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "in-progress"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              In Progress
              {prescriptions.filter((rx) => rx.status.toLowerCase() !== "delivered").length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                  {prescriptions.filter((rx) => rx.status.toLowerCase() !== "delivered").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "completed"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              Completed
              {prescriptions.filter((rx) => rx.status.toLowerCase() === "delivered").length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                  {prescriptions.filter((rx) => rx.status.toLowerCase() === "delivered").length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions - Show when list is empty */}
        {filteredPrescriptions.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/prescriptions/new/step1"
              className="group bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-[4px] p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              <FileText className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-bold">Write New Prescription</h3>
              <p className="text-sm mt-2 text-white/80">Create and submit e-prescriptions</p>
            </Link>
            <Link
              href="/basic-emr"
              className="group bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-[4px] p-8 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              <UserPlus className="h-12 w-12 mb-3" />
              <h3 className="text-xl font-bold">Register New Patient</h3>
              <p className="text-sm mt-2 text-white/80">Add patients to your EMR</p>
            </Link>
          </div>
        )}

        {/* Prescriptions Table */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-12 text-center">
            <Pill className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {activeTab === "in-progress"
                ? "No prescriptions in progress"
                : "No completed prescriptions"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === "in-progress"
                ? "All prescriptions have been delivered"
                : "No prescriptions have been completed yet"}
            </p>
            {activeTab === "in-progress" && (
              <Link href="/prescriptions/new/step1">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Prescription
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Patient Name</TableHead>
                    <TableHead className="font-semibold">
                      Medication + Strength/Dosage
                    </TableHead>
                    <TableHead className="font-semibold">
                      Quantity / Refills
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Queue ID</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id} className="hover:bg-gray-50">
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(prescription.dateTime)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {prescription.patientName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {prescription.medication}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {prescription.strength}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>Qty: {prescription.quantity}</span>
                          <span className="text-sm text-muted-foreground">
                            Refills: {prescription.refills}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={getStatusColor(prescription.status)}
                          >
                            {prescription.status}
                          </Badge>
                          {prescription.trackingNumber && (
                            <span className="text-xs text-muted-foreground">
                              Tracking: {prescription.trackingNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {prescription.queueId}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(prescription)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* View Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Prescription Details
              </DialogTitle>
              <DialogDescription>
                Queue ID: {selectedPrescription?.queueId}
              </DialogDescription>
            </DialogHeader>

            {selectedPrescription && (
              <div className="space-y-6 mt-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedPrescription.status)}
                  >
                    {selectedPrescription.status}
                  </Badge>
                </div>

                {/* Patient Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Patient Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {selectedPrescription.patientName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Date & Time
                        </p>
                        <p className="font-medium">
                          {formatDateTime(selectedPrescription.dateTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medication Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">
                    Medication Information
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Medication
                        </p>
                        <p className="font-semibold text-lg">
                          {selectedPrescription.medication}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Strength/Dosage
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.strength}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Form</p>
                        <p className="font-medium">
                          {selectedPrescription.form}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Quantity
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Refills</p>
                        <p className="font-medium">
                          {selectedPrescription.refills}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Dispense as Written
                        </p>
                        <p className="font-medium">
                          {selectedPrescription.dispenseAsWritten ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Directions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">
                    Directions (SIG)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{selectedPrescription.sig}</p>
                  </div>
                </div>

                {/* Pharmacy Notes */}
                {selectedPrescription.pharmacyNotes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">
                      Notes to Pharmacy
                    </h3>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-gray-900">
                        {selectedPrescription.pharmacyNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DefaultLayout>
  );
}
